<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '@/firebase';
import { doc, getDoc, onSnapshot, updateDoc, writeBatch, collection, getDocs, setDoc } from 'firebase/firestore';
import type { Room, Player, Proposition } from '@/types';

const route = useRoute();
const router = useRouter();

const roomCode = (route.query.room as string || '').toUpperCase();
const myId = localStorage.getItem('playerId');

const room = ref<Room | null>(null);
const players = ref<Player[]>([]);

const isHost = computed(() => room.value?.hostId === myId);
const myPlayer = computed(() => players.value.find(p => p.id === myId));

// Local state
const bluffText = ref('');
const selectedPropositionIndex = ref<number | null>(null);
const timeRemaining = ref(20);
let timerInterval: any = null;

// Shuffled propositions for voting
const shuffledPropositions = ref<Proposition[]>([]);

let unsubscribeRoom: () => void;
let unsubscribePlayers: () => void;

onMounted(async () => {
  if (!roomCode || !myId) {
    router.push('/');
    return;
  }

  const roomRef = doc(db, 'rooms', roomCode);
  unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
    if (docSnap.exists()) {
      room.value = docSnap.data() as Room;
      
      if (room.value.state === 'results') {
        router.push({ name: 'results', query: { room: roomCode } });
      }
      
      if (room.value.phase === 'voting' && shuffledPropositions.value.length === 0) {
        // Prepare shuffled propositions once when entering voting phase
        let props = room.value.propositions || [];
        // Add true answer
        if (room.value.question && !props.find(p => p.playerId === 'true_answer')) {
            props.push({
                playerId: 'true_answer',
                text: room.value.question.trueAnswer,
                voters: []
            });
        }
        // Shuffle
        shuffledPropositions.value = [...props].sort(() => Math.random() - 0.5);
      }
      
      if (room.value.phase === 'bluffing') {
          shuffledPropositions.value = [];
          bluffText.value = '';
          selectedPropositionIndex.value = null;
      }
    } else {
      router.push('/');
    }
  });

  const playersRef = collection(db, `rooms/${roomCode}/players`);
  unsubscribePlayers = onSnapshot(playersRef, (querySnap) => {
    const p: Player[] = [];
    querySnap.forEach((d) => p.push(d.data() as Player));
    players.value = p.sort((a, b) => b.score - a.score);
  });

  timerInterval = setInterval(() => {
    if (room.value?.phaseEndsAt) {
      const remaining = Math.ceil((room.value.phaseEndsAt - Date.now()) / 1000);
      timeRemaining.value = Math.max(0, remaining);
      
      if (timeRemaining.value === 0 && isHost.value) {
        handleTimerEnd();
      }
    }
  }, 1000);
});

onUnmounted(() => {
  if (unsubscribeRoom) unsubscribeRoom();
  if (unsubscribePlayers) unsubscribePlayers();
  if (timerInterval) clearInterval(timerInterval);
});

const submitBluff = async () => {
    if (!bluffText.value.trim() || myPlayer.value?.hasSubmitted) return;
    
    const roomRef = doc(db, 'rooms', roomCode);
    const pRef = doc(db, `rooms/${roomCode}/players`, myId!);
    
    const batch = writeBatch(db);
    batch.update(pRef, { hasSubmitted: true });
    
    const currentProps = room.value?.propositions || [];
    batch.update(roomRef, { 
        propositions: [...currentProps, {
            playerId: myId!,
            text: bluffText.value.trim(),
            voters: []
        }]
    });
    
    await batch.commit();
};

const submitVote = async () => {
    if (selectedPropositionIndex.value === null || myPlayer.value?.hasVoted) return;
    
    const prop = shuffledPropositions.value[selectedPropositionIndex.value];
    // Cannot vote for own bluff
    if (prop.playerId === myId) {
        alert("Tu ne peux pas voter pour ton propre bluff !");
        return;
    }
    
    const roomRef = doc(db, 'rooms', roomCode);
    const pRef = doc(db, `rooms/${roomCode}/players`, myId!);
    
    const batch = writeBatch(db);
    batch.update(pRef, { hasVoted: true });
    
    // Update the actual proposition array in room
    let props = room.value?.propositions || [];
    // If it's the true answer, it might not be in the room's propositions array initially,
    // so we ensure it's there or handle it.
    let targetPropIndex = props.findIndex(p => p.playerId === prop.playerId);
    
    if (targetPropIndex === -1 && prop.playerId === 'true_answer') {
        props.push({ playerId: 'true_answer', text: prop.text, voters: [myId!] });
    } else if (targetPropIndex !== -1) {
        props[targetPropIndex].voters.push(myId!);
    }
    
    batch.update(roomRef, { propositions: props });
    await batch.commit();
};

// Host controls
let isTransitioning = false;
const handleTimerEnd = async () => {
    if (!isHost.value || !room.value || isTransitioning) return;
    isTransitioning = true;
    
    const roomRef = doc(db, 'rooms', roomCode);
    
    if (room.value.phase === 'bluffing') {
        await updateDoc(roomRef, {
            phase: 'voting',
            phaseEndsAt: Date.now() + 20000
        });
    } else if (room.value.phase === 'voting') {
        // Calculate scores
        await calculateScores();
        await updateDoc(roomRef, {
            phase: 'revealing',
            phaseEndsAt: null // manual next by host
        });
    }
    isTransitioning = false;
};

const calculateScores = async () => {
    const batch = writeBatch(db);
    const props = room.value?.propositions || [];
    
    players.value.forEach(p => {
        let newScore = p.score;
        
        // Did they find the true answer?
        const trueProp = props.find(pr => pr.playerId === 'true_answer');
        if (trueProp && trueProp.voters.includes(p.id)) {
            newScore += 2; // +2 for finding truth
        }
        
        // Did someone vote for their bluff?
        const theirProp = props.find(pr => pr.playerId === p.id);
        if (theirProp) {
            newScore += theirProp.voters.length * 1; // +1 per trapped player
        }
        
        const pRef = doc(db, `rooms/${roomCode}/players`, p.id);
        batch.update(pRef, { score: newScore });
    });
    
    await batch.commit();
};

const nextRound = async () => {
    if (!isHost.value || !room.value) return;
    
    const roomRef = doc(db, 'rooms', roomCode);
    
    if (room.value.currentRound >= room.value.maxRounds) {
        await updateDoc(roomRef, { state: 'results' });
    } else {
        const batch = writeBatch(db);
        players.value.forEach(p => {
            const pRef = doc(db, `rooms/${roomCode}/players`, p.id);
            batch.update(pRef, { hasSubmitted: false, hasVoted: false });
        });
        
        const { getRandomQuestion } = await import('@/data/questions');
        const question = getRandomQuestion();
        
        batch.update(roomRef, {
            currentRound: room.value.currentRound + 1,
            phase: 'bluffing',
            phaseEndsAt: Date.now() + 20000,
            question: question,
            propositions: []
        });
        
        await batch.commit();
    }
};

</script>

<template>
  <div class="min-h-screen flex flex-col relative bg-surface" v-if="room">
    <!-- Geometric Background Decoration -->
    <div aria-hidden="true" class="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none opacity-20">
      <div class="absolute border-2 border-primary rounded-full w-24 h-24 top-[10%] left-[5%]"></div>
      <div class="absolute border-2 border-secondary rotate-12 w-32 h-32 top-[60%] left-[85%]"></div>
    </div>

    <!-- Top AppBar -->
    <header class="bg-surface/90 backdrop-blur-md flex justify-between items-center w-full px-gutter h-20 max-w-7xl mx-auto border-b-4 border-on-surface z-50">
      <img src="@/assets/logo.svg" alt="Fictio Logo" class="h-10 w-auto" />
      <div class="flex items-center gap-4">
        <span class="font-label-bold">Tour {{ room.currentRound }} / {{ room.maxRounds }}</span>
        <button @click="router.push('/lobby?room=' + roomCode)" class="w-10 h-10 border-2 border-on-surface rounded-full flex items-center justify-center bg-surface-variant hover:bg-surface-dim">
          <span class="material-symbols-outlined text-[20px]">menu</span>
        </button>
      </div>
    </header>

    <main class="flex-grow flex flex-col items-center px-gutter pt-8 max-w-4xl mx-auto w-full relative z-10">
      
      <!-- Status Header -->
      <div class="w-full flex justify-between items-center mb-8">
        <div class="bg-surface-variant text-on-surface-variant font-label-bold px-4 py-2 rounded-full border-2 border-on-surface uppercase tracking-widest">
            Phase de {{ room.phase === 'bluffing' ? 'Bluff' : (room.phase === 'voting' ? 'Vote' : 'Résultats') }}
        </div>
        <div class="flex items-center gap-2" v-if="room.phase !== 'revealing'">
          <span class="material-symbols-outlined text-secondary">timer</span>
          <span class="font-headline-sm text-secondary">{{ timeRemaining }}s</span>
        </div>
      </div>

      <!-- Phase: Bluffing -->
      <div v-if="room.phase === 'bluffing'" class="w-full flex flex-col items-center">
        <div class="w-full bg-surface border-4 border-on-surface rounded-xl p-card-padding flex flex-col items-center text-center mb-10 brutal-shadow-lg relative overflow-hidden">
          <h2 class="font-label-bold text-on-surface-variant uppercase mb-4 tracking-widest">
              {{ room.question?.type === 'word' ? 'Le mot mystère est :' : 'La question est :' }}
          </h2>
          <h1 class="font-display-lg text-primary break-all mb-4">
              {{ room.question?.text }}
          </h1>
          <p class="font-body-lg text-on-surface max-w-lg">
              {{ room.question?.type === 'word' ? 'Invente la définition la plus crédible pour piéger tes amis.' : 'Invente une fausse réponse crédible.' }}
          </p>
        </div>

        <div class="w-full max-w-2xl flex flex-col gap-6" v-if="!myPlayer?.hasSubmitted">
          <div class="relative w-full">
            <textarea v-model="bluffText" class="w-full input-brutal rounded-xl p-4 font-body-lg" rows="3" placeholder="Tape ton bluff ici..."></textarea>
          </div>
          <button @click="submitBluff" class="w-full btn-brutal bg-secondary text-on-secondary font-headline-sm py-4 rounded-xl flex justify-center items-center gap-3">
            <span>Soumettre</span>
            <span class="material-symbols-outlined">send</span>
          </button>
        </div>
        <div v-else class="text-center font-headline-sm text-on-surface-variant animate-pulse">
            En attente des autres joueurs...
        </div>
      </div>

      <!-- Phase: Voting -->
      <div v-else-if="room.phase === 'voting'" class="w-full flex flex-col items-center">
          <div class="text-center mb-10 w-full">
            <h1 class="font-headline-md text-on-surface mb-2">Quel est le vrai ?</h1>
            <p class="font-body-lg text-on-surface-variant">Votez pour la réponse qui vous semble correcte.</p>
          </div>

          <div v-if="!myPlayer?.hasVoted" class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              <button 
                v-for="(prop, index) in shuffledPropositions" 
                :key="index"
                @click="selectedPropositionIndex = index"
                :class="['border-4 border-on-surface rounded-xl p-4 text-left flex flex-col bg-surface transition-transform hover:translate-y-[-2px]', selectedPropositionIndex === index ? 'border-secondary shadow-[0_0_0_4px_#ab008f]' : 'brutal-shadow']"
              >
                 <p class="font-body-lg text-on-surface flex-grow">{{ prop.text }}</p>
              </button>
          </div>
          <div v-else class="text-center font-headline-sm text-on-surface-variant animate-pulse">
              Vote enregistré ! En attente...
          </div>

          <div v-if="!myPlayer?.hasVoted" class="mt-8 w-full max-w-md">
              <button @click="submitVote" :disabled="selectedPropositionIndex === null" class="w-full btn-brutal bg-secondary text-on-secondary rounded-lg font-headline-sm py-4 flex items-center justify-center gap-2">
                 <span class="material-symbols-outlined">how_to_vote</span> Valider
              </button>
          </div>
      </div>

      <!-- Phase: Revealing -->
      <div v-else-if="room.phase === 'revealing'" class="w-full flex flex-col items-center gap-6">
          <div class="w-full border-4 border-[#00c853] bg-[#e8f5e9] p-6 rounded-xl brutal-shadow-lg text-center">
              <h2 class="font-label-bold text-[#00c853] uppercase mb-2">La vraie réponse était :</h2>
              <p class="font-headline-md text-on-surface">{{ room.question?.trueAnswer }}</p>
          </div>

          <div class="w-full max-w-2xl mt-8">
              <h3 class="font-headline-sm mb-4">Classement actuel :</h3>
              <div v-for="p in players" :key="p.id" class="flex justify-between items-center border-b-2 border-on-surface py-2">
                  <span class="font-body-lg font-bold">{{ p.name }}</span>
                  <span class="font-headline-sm text-primary">{{ p.score }} pts</span>
              </div>
          </div>

          <div v-if="isHost" class="mt-8 w-full max-w-md">
              <button @click="nextRound" class="w-full btn-brutal bg-tertiary-fixed text-on-surface rounded-lg font-headline-sm py-4">
                  Tour Suivant
              </button>
          </div>
          <div v-else class="mt-8 animate-pulse text-on-surface-variant font-label-bold">
              En attente de l'hôte...
          </div>
      </div>

    </main>
  </div>
</template>
