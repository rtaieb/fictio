<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '@/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, updateDoc, writeBatch } from 'firebase/firestore';
import type { Room, Player } from '@/types';
import { generateId } from '@/utils/helpers';
import { getRandomQuestion } from '@/data/questions';

const route = useRoute();
const router = useRouter();

const roomCode = (route.query.room as string || '').toUpperCase();
const pseudo = localStorage.getItem('pseudo') || 'Anonyme';

// Local Player ID
let myId = localStorage.getItem('playerId');
if (!myId) {
  myId = generateId() + generateId();
  localStorage.setItem('playerId', myId);
}

const room = ref<Room | null>(null);
const players = ref<Player[]>([]);
const isHost = computed(() => room.value?.hostId === myId);

// Settings
const maxRounds = ref(5);

let unsubscribeRoom: () => void;
let unsubscribePlayers: () => void;

onMounted(async () => {
  if (!roomCode) {
    router.push({ name: 'home' });
    return;
  }

  const roomRef = doc(db, 'rooms', roomCode);
  const roomSnap = await getDoc(roomRef);

  const colors = ['bg-primary', 'bg-secondary', 'bg-[#00c853]', 'bg-[#ff3d00]', 'bg-tertiary', 'bg-primary-container'];
  const myColor = colors[Math.floor(Math.random() * colors.length)];

  if (!roomSnap.exists()) {
    // Create room
    await setDoc(roomRef, {
      id: roomCode,
      createdAt: Date.now(),
      state: 'lobby',
      currentRound: 0,
      maxRounds: 5,
      hostId: myId
    } as Room);
  } else {
    const existingData = roomSnap.data() as Room;
    if (existingData.state !== 'lobby') {
       // if reconnecting, go to game
       if (existingData.state === 'playing') router.push({ name: 'game', query: { room: roomCode } });
    }
  }

  // Join as player
  const myPlayerRef = doc(db, `rooms/${roomCode}/players`, myId);
  const myPlayerSnap = await getDoc(myPlayerRef);
  if (!myPlayerSnap.exists()) {
      await setDoc(myPlayerRef, {
        id: myId,
        name: pseudo,
        score: 0,
        isHost: roomSnap.exists() ? (roomSnap.data() as Room).hostId === myId : true,
        avatarColor: myColor
      } as Player);
  }

  // Listeners
  unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as Room;
      room.value = data;
      if (data.state === 'playing') {
        router.push({ name: 'game', query: { room: roomCode } });
      }
    } else {
       router.push({ name: 'home' });
    }
  });

  const playersRef = collection(db, `rooms/${roomCode}/players`);
  unsubscribePlayers = onSnapshot(playersRef, (querySnap) => {
    const p: Player[] = [];
    querySnap.forEach((d) => p.push(d.data() as Player));
    players.value = p;
  });
});

onUnmounted(() => {
  if (unsubscribeRoom) unsubscribeRoom();
  if (unsubscribePlayers) unsubscribePlayers();
});

const copyCode = () => {
  navigator.clipboard.writeText(roomCode);
  alert("Code copié !");
};

const copyLink = () => {
  const url = window.location.origin + '?room=' + roomCode;
  navigator.clipboard.writeText(url);
  alert("Lien copié !");
};

const startGame = async () => {
  if (!isHost.value) return;
  const roomRef = doc(db, 'rooms', roomCode);
  
  // reset all players score and ready state
  const batch = writeBatch(db);
  players.value.forEach(p => {
    const pRef = doc(db, `rooms/${roomCode}/players`, p.id);
    batch.update(pRef, { score: 0, hasSubmitted: false, hasVoted: false });
  });
  
  const question = getRandomQuestion();
  batch.update(roomRef, {
    state: 'playing',
    currentRound: 1,
    maxRounds: maxRounds.value,
    phase: 'bluffing',
    phaseEndsAt: Date.now() + 20000, // 20s
    question: question,
    propositions: [],
    readyPlayers: []
  });
  
  await batch.commit();
};

const updateSettings = async () => {
   if (!isHost.value) return;
   const roomRef = doc(db, 'rooms', roomCode);
   await updateDoc(roomRef, { maxRounds: maxRounds.value });
};

</script>

<template>
  <div class="min-h-screen flex flex-col relative" v-if="room">
    <!-- Geometric Background Decoration -->
    <div aria-hidden="true" class="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
      <div class="absolute opacity-5 border-2 border-primary rounded-full w-24 h-24 top-[10%] left-[5%]"></div>
      <div class="absolute opacity-5 border-2 border-secondary rotate-12 w-32 h-32 top-[60%] left-[85%]"></div>
      <div class="absolute opacity-5 border-2 border-tertiary rounded-lg w-16 h-16 top-[20%] left-[80%]"></div>
      <div class="absolute opacity-5 border-2 border-primary rounded-full w-12 h-12 top-[80%] left-[10%]"></div>
    </div>

    <header class="bg-surface/80 backdrop-blur-md text-primary font-headline-md text-headline-md border-b-4 border-on-surface flex justify-between items-center w-full px-gutter h-20 max-w-7xl mx-auto z-40 relative">
      <div class="flex items-center gap-4">
        <button @click="router.push('/')" aria-label="Quitter" class="w-12 h-12 border-4 border-on-surface rounded-full flex items-center justify-center bg-surface-container-high hover:bg-surface-variant transition-colors brutal-interactive">
          <span class="material-symbols-outlined">close</span>
        </button>
        <h1 class="font-display-lg text-display-lg-mobile italic uppercase text-primary tracking-tight">Fictio</h1>
      </div>
    </header>

    <main class="flex-grow w-full max-w-7xl mx-auto px-container-margin py-8 flex flex-col gap-12 pb-40 relative z-10">
      
      <!-- Room Code Section -->
      <section class="flex flex-col items-center justify-center w-full">
        <div class="bg-surface-container border-[4px] border-on-surface rounded-xl p-card-padding flex flex-col items-center justify-center brutal-shadow-lg transform rotate-[-1deg] w-full max-w-md relative overflow-hidden">
          <span class="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-2 z-10 bg-surface px-4 py-1 border-2 border-on-surface rounded-full">Code du salon</span>
          <div class="flex items-center gap-4 z-10">
            <span class="font-display-lg text-display-lg text-on-surface tracking-tighter">{{ roomCode }}</span>
            <button @click="copyCode" class="w-12 h-12 bg-primary text-on-primary border-[3px] border-on-surface rounded-lg flex items-center justify-center brutal-shadow brutal-interactive transition-all" title="Copier le code">
              <span class="material-symbols-outlined">content_copy</span>
            </button>
            <button @click="copyLink" class="w-12 h-12 bg-secondary text-on-secondary border-[3px] border-on-surface rounded-lg flex items-center justify-center brutal-shadow brutal-interactive transition-all" title="Copier le lien">
              <span class="material-symbols-outlined">link</span>
            </button>
          </div>
          <p class="font-body-md text-body-md text-on-surface-variant mt-4 text-center z-10">En attente des autres joueurs...</p>
        </div>
      </section>

      <!-- Settings (Host) -->
      <section v-if="isHost" class="w-full max-w-md mx-auto bg-surface-container border-4 border-on-surface p-4 rounded-xl brutal-shadow">
          <label class="font-label-bold block mb-2 text-on-surface">Nombre de tours : {{ maxRounds }}</label>
          <input type="range" min="1" max="10" v-model.number="maxRounds" @change="updateSettings" class="w-full" />
      </section>
      <section v-else class="w-full max-w-md mx-auto text-center">
          <p class="font-label-bold text-on-surface-variant">Tours prévus : {{ room.maxRounds }}</p>
      </section>

      <!-- Players List Section -->
      <section class="w-full flex flex-col gap-6">
        <div class="flex items-center justify-between border-b-4 border-on-surface pb-4">
          <h2 class="font-headline-md text-headline-md text-on-surface">Joueurs <span class="text-primary">({{ players.length }}/8)</span></h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          
          <div v-for="player in players" :key="player.id" class="flex flex-col items-center gap-3 relative group">
            <div v-if="player.isHost" class="absolute -top-3 -right-3 z-20 w-8 h-8 bg-tertiary-fixed border-[3px] border-on-surface rounded-full flex items-center justify-center brutal-shadow" title="Hôte">
              <span class="material-symbols-outlined text-[16px]">stars</span>
            </div>
            <div :class="['w-24 h-24 rounded-full border-[4px] border-on-surface brutal-shadow relative overflow-hidden flex items-center justify-center text-4xl text-white font-bold', player.avatarColor]">
              {{ player.name.charAt(0).toUpperCase() }}
            </div>
            <span class="font-label-bold text-label-bold text-on-surface bg-surface border-2 border-on-surface px-3 py-1 rounded-full whitespace-nowrap">
              {{ player.name }} <span v-if="player.id === myId">(Moi)</span>
            </span>
          </div>

        </div>
      </section>
    </main>

    <!-- Fixed Bottom Action (Host Only) -->
    <div v-if="isHost" class="fixed bottom-0 left-0 w-full p-container-margin bg-gradient-to-t from-surface-container via-surface-container-low/90 to-transparent z-50 flex justify-center">
      <button @click="startGame" class="w-full max-w-lg bg-tertiary-fixed text-on-surface border-[4px] border-on-surface rounded-xl px-8 py-6 font-display-lg-mobile text-display-lg-mobile uppercase tracking-tight flex items-center justify-center gap-4 brutal-shadow-lg brutal-interactive transition-all group overflow-hidden relative">
        <span class="relative z-10">Lancer la partie</span>
        <span class="material-symbols-outlined text-4xl relative z-10 group-hover:translate-x-2 transition-transform">play_arrow</span>
      </button>
    </div>
  </div>
</template>
