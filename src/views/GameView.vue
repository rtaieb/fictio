<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '@/firebase';
import { doc, onSnapshot, updateDoc, writeBatch, collection, arrayUnion } from 'firebase/firestore';
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
const revealStep = ref<'votes' | 'truth'>('votes');

const getPlayerName = (id: string) => players.value.find(p => p.id === id)?.name || 'Inconnu';
const getPlayerColor = (id: string) => players.value.find(p => p.id === id)?.avatarColor || 'bg-primary';

const checkFastForward = () => {
    if (!isHost.value || !room.value) return;
    
    if (room.value.phase === 'bluffing' && players.value.length > 0 && players.value.every(p => p.hasSubmitted)) {
        const newEndsAt = Date.now() + 3500; // 3 seconds countdown
        if (room.value.phaseEndsAt && room.value.phaseEndsAt > newEndsAt) {
            updateDoc(doc(db, 'rooms', roomCode), { phaseEndsAt: newEndsAt });
        }
    }
    
    if (room.value.phase === 'voting' && players.value.length > 0 && players.value.every(p => p.hasVoted)) {
        const newEndsAt = Date.now() + 3500; // 3 seconds countdown
        if (room.value.phaseEndsAt && room.value.phaseEndsAt > newEndsAt) {
            updateDoc(doc(db, 'rooms', roomCode), { phaseEndsAt: newEndsAt });
        }
    }
};

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
      const newData = docSnap.data() as Room;
      const isNewRound = room.value?.currentRound !== newData.currentRound;
      room.value = newData;
      
      if (room.value.state === 'results') {
        router.push({ name: 'results', query: { room: roomCode } }).catch(() => {
            window.location.href = `#/results?room=${roomCode}`;
        });
        return;
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
      
      if (isNewRound && room.value.phase === 'bluffing') {
          shuffledPropositions.value = [];
          bluffText.value = '';
          selectedPropositionIndex.value = null;
          revealStep.value = 'votes';
      }
      
      if (room.value.phase === 'revealing' && revealStep.value === 'votes') {
          setTimeout(() => {
              if (room.value?.phase === 'revealing') {
                  revealStep.value = 'truth';
              }
          }, 7000);
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
    checkFastForward();
  });

  timerInterval = setInterval(() => {
    if (room.value?.phaseEndsAt) {
      const remaining = Math.ceil((room.value.phaseEndsAt - Date.now()) / 1000);
      timeRemaining.value = Math.max(0, remaining);
      
      if (timeRemaining.value === 0) {
        if (room.value.phase === 'bluffing' && myPlayer.value && !myPlayer.value.hasSubmitted) {
            submitBluff(true);
        }
        if (isHost.value) {
            handleTimerEnd();
        }
      }
    }
  }, 1000);
  
  window.addEventListener('pagehide', handleDisconnect);
});

onUnmounted(() => {
  if (unsubscribeRoom) unsubscribeRoom();
  if (unsubscribePlayers) unsubscribePlayers();
  if (timerInterval) clearInterval(timerInterval);
  window.removeEventListener('pagehide', handleDisconnect);
});

const handleDisconnect = () => {
    if (myId && roomCode) {
        fetch(`https://firestore.googleapis.com/v1/projects/fictio-7fcc4/databases/(default)/documents/rooms/${roomCode}/players/${myId}`, {
           method: 'DELETE',
           keepalive: true
        }).catch(() => {});
    }
};

const quitGame = () => {
    handleDisconnect();
    router.push('/');
};

const submitBluff = async (autoSubmit: boolean = false) => {
    if (!autoSubmit && !bluffText.value.trim()) return;
    if (myPlayer.value?.hasSubmitted) return;
    
    let textToSubmit = bluffText.value.trim();
    let isEmpty = false;
    
    if (autoSubmit && !textToSubmit) {
        textToSubmit = `${myPlayer.value?.name || 'Le joueur'} n'a rien écrit 😴`;
        isEmpty = true;
    }
    
    const roomRef = doc(db, 'rooms', roomCode);
    const pRef = doc(db, `rooms/${roomCode}/players`, myId!);
    
    const batch = writeBatch(db);
    batch.update(pRef, { hasSubmitted: true });
    
    batch.update(roomRef, { 
        propositions: arrayUnion({
            playerId: myId!,
            text: textToSubmit,
            voters: [],
            isEmpty: isEmpty
        })
    });
    
    await batch.commit();
};

const submitVote = async (index: number) => {
    if (myPlayer.value?.hasVoted) return;
    
    const prop = shuffledPropositions.value[index];
    if (prop.playerId === myId || prop.isEmpty) return;
    
    selectedPropositionIndex.value = index;
    
    const pRef = doc(db, `rooms/${roomCode}/players`, myId!);
    await updateDoc(pRef, { hasVoted: true, votedFor: prop.playerId });
};

const getVoters = (propPlayerId: string) => {
    return players.value.filter(p => p.votedFor === propPlayerId);
};

// Host controls
let isTransitioning = false;
const handleTimerEnd = async () => {
    if (!isHost.value || !room.value || isTransitioning) return;
    isTransitioning = true;
    
    const roomRef = doc(db, 'rooms', roomCode);
    const voteLimit = room.value.voteTimeLimit || 20;
    
    if (room.value.phase === 'bluffing') {
        await updateDoc(roomRef, {
            phase: 'voting',
            phaseEndsAt: Date.now() + (voteLimit * 1000)
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
    
    players.value.forEach(p => {
        let newScore = p.score;
        
        // Did they find the true answer?
        if (p.votedFor === 'true_answer') {
            newScore += 2; // +2 for finding truth
        }
        
        // Did someone vote for their bluff?
        const trappedPlayers = players.value.filter(other => other.votedFor === p.id);
        newScore += trappedPlayers.length * 1; // +1 per trapped player
        
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
        router.push({ name: 'results', query: { room: roomCode } }).catch(() => {
            window.location.href = `#/results?room=${roomCode}`;
        });
    } else {
        const batch = writeBatch(db);
        players.value.forEach(p => {
            const pRef = doc(db, `rooms/${roomCode}/players`, p.id);
            batch.update(pRef, { hasSubmitted: false, hasVoted: false, votedFor: null });
        });
        
        const { getRandomQuestion } = await import('@/data/questions');
        const question = getRandomQuestion();
        const bluffLimit = room.value.bluffTimeLimit || 30;
        
        batch.update(roomRef, {
            currentRound: room.value.currentRound + 1,
            phase: 'bluffing',
            phaseEndsAt: Date.now() + (bluffLimit * 1000),
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
        <button @click="quitGame" class="w-10 h-10 border-2 border-on-surface rounded-full flex items-center justify-center bg-surface-variant hover:bg-surface-dim brutal-interactive" title="Quitter la partie">
          <span class="material-symbols-outlined text-[20px]">close</span>
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

      <!-- Question Container (Always visible) -->
      <div class="w-full bg-surface border-4 border-on-surface rounded-xl p-6 flex flex-col items-center text-center mb-10 brutal-shadow-lg relative overflow-hidden">
          <h2 class="font-label-bold text-on-surface-variant uppercase mb-2 tracking-widest text-sm">
              {{ room.question?.type === 'word' ? 'Le mot mystère est :' : 'La question est :' }}
          </h2>
          <h1 class="font-display-sm md:font-display-md text-primary break-all mb-2">
              {{ room.question?.text }}
          </h1>
          <p v-if="room.phase === 'bluffing'" class="font-body-lg text-on-surface max-w-lg">
              {{ room.question?.type === 'word' ? 'Invente la définition la plus crédible pour piéger tes amis.' : 'Invente une fausse réponse crédible.' }}
          </p>
      </div>

      <!-- Phase: Bluffing -->
      <div v-if="room.phase === 'bluffing'" class="w-full flex flex-col items-center">
        <div class="w-full max-w-2xl flex flex-col gap-6" v-if="!myPlayer?.hasSubmitted">
          <div class="relative w-full">
            <textarea v-model="bluffText" class="w-full input-brutal rounded-xl p-4 font-body-lg" rows="3" placeholder="Tape ton bluff ici..."></textarea>
          </div>
          <button @click="submitBluff(false)" class="w-full btn-brutal bg-secondary text-on-secondary font-headline-sm py-4 rounded-xl flex justify-center items-center gap-3">
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

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              <button 
                v-for="(prop, index) in shuffledPropositions" 
                :key="index"
                @click="submitVote(index)"
                :disabled="prop.playerId === myId || prop.isEmpty || myPlayer?.hasVoted"
                :class="[
                   'border-4 border-on-surface rounded-xl p-4 text-left flex flex-col transition-all duration-300 w-full', 
                   selectedPropositionIndex === index ? 'border-secondary shadow-[0_0_0_4px_#ab008f] scale-[1.02] bg-secondary' : 'bg-surface brutal-shadow',
                   !myPlayer?.hasVoted && prop.playerId !== myId && !prop.isEmpty ? 'hover:translate-y-[-2px] hover:shadow-[0_0_0_4px_#ab008f]' : '',
                   (prop.playerId === myId || prop.isEmpty) ? 'opacity-50 cursor-not-allowed filter grayscale' : '',
                   myPlayer?.hasVoted && selectedPropositionIndex !== index ? 'opacity-50' : ''
                ]"
              >
                 <p class="font-body-lg flex-grow whitespace-normal break-words w-full" :class="selectedPropositionIndex === index ? 'text-white' : 'text-on-surface'">{{ prop.text }}</p>
                 <span v-if="prop.playerId === myId" class="text-xs font-label-bold mt-2 opacity-70" :class="selectedPropositionIndex === index ? 'text-white' : 'text-on-surface'">Ton bluff</span>
                 <span v-if="prop.isEmpty" class="text-xs font-label-bold mt-2 opacity-70 text-on-surface">Vote impossible</span>
              </button>
          </div>
          <div v-if="myPlayer?.hasVoted" class="text-center font-headline-sm text-on-surface-variant animate-pulse mt-8">
              Vote enregistré ! En attente...
          </div>
      </div>

      <!-- Phase: Revealing -->
      <div v-else-if="room.phase === 'revealing'" class="w-full flex flex-col items-center gap-8">
          <div class="text-center w-full">
            <h1 class="font-headline-md text-on-surface mb-2" v-if="revealStep === 'votes'">Dépouillement des votes...</h1>
            <h1 class="font-headline-md text-on-surface mb-2" v-else>La Vérité Éclate !</h1>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              <div v-for="(prop, index) in shuffledPropositions" :key="index" 
                   :class="['border-4 rounded-xl p-4 flex flex-col gap-4 transition-all duration-500', 
                            revealStep === 'truth' && prop.playerId === 'true_answer' ? 'border-[#00c853] bg-[#e8f5e9] scale-105 shadow-[8px_8px_0_0_#00c853]' : 
                            revealStep === 'truth' && prop.playerId !== 'true_answer' ? 'border-on-surface bg-surface opacity-60' : 'border-on-surface bg-surface brutal-shadow']">
                 
                 <p class="font-body-lg text-on-surface font-bold whitespace-normal break-words w-full">{{ prop.text }}</p>
                 
                 <div v-if="revealStep === 'truth' && prop.playerId === 'true_answer'" class="font-label-bold text-[#00c853] uppercase bg-white px-3 py-1 rounded-full border-2 border-[#00c853] self-start">Bonne réponse !</div>
                 <div v-else-if="revealStep === 'truth' && prop.playerId !== 'true_answer'" class="font-label-bold text-secondary uppercase bg-white px-3 py-1 rounded-full border-2 border-secondary self-start">{{ getPlayerName(prop.playerId) }}</div>
                 
                 <div class="flex flex-wrap gap-2 mt-auto" v-if="getVoters(prop.playerId).length > 0">
                     <div v-for="voter in getVoters(prop.playerId)" :key="voter.id" class="px-3 py-1 rounded-full border-[3px] border-on-surface flex items-center justify-center text-sm text-white font-bold brutal-shadow-sm" :class="getPlayerColor(voter.id)">
                        {{ voter.name }}
                     </div>
                 </div>
              </div>
          </div>

          <div v-if="isHost && revealStep === 'truth'" class="mt-8 w-full max-w-md">
              <button @click="nextRound" class="w-full btn-brutal bg-tertiary-fixed text-on-surface rounded-lg font-headline-sm py-4">
                  {{ room.currentRound >= room.maxRounds ? 'Voir le podium' : 'Tour Suivant' }}
              </button>
          </div>
          <div v-else-if="!isHost && revealStep === 'truth'" class="mt-8 animate-pulse text-on-surface-variant font-label-bold">
              En attente de l'hôte...
          </div>

          <div class="w-full max-w-2xl mt-4" v-if="revealStep === 'truth'">
              <h3 class="font-headline-sm mb-4 border-b-4 border-on-surface pb-2">Classement actuel :</h3>
              <div class="flex flex-col gap-2">
                <div v-for="p in players" :key="p.id" class="flex justify-between items-center bg-surface-container-low px-4 py-3 rounded-lg border-2 border-on-surface">
                    <div class="flex items-center gap-3">
                      <div :class="['w-8 h-8 rounded-full border-2 border-on-surface flex items-center justify-center text-xs text-white font-bold', p.avatarColor]">
                        {{ p.name.charAt(0).toUpperCase() }}
                      </div>
                      <span class="font-body-lg font-bold">{{ p.name }}</span>
                    </div>
                    <span class="font-headline-sm text-primary">{{ p.score }} pts</span>
                </div>
              </div>
          </div>
      </div>

    </main>
  </div>
</template>
