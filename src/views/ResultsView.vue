<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '@/firebase';
import { doc, getDoc, onSnapshot, updateDoc, collection } from 'firebase/firestore';
import type { Room, Player } from '@/types';

const route = useRoute();
const router = useRouter();

const roomCode = (route.query.room as string || '').toUpperCase();
const myId = localStorage.getItem('playerId');

const room = ref<Room | null>(null);
const players = ref<Player[]>([]);

const isHost = computed(() => room.value?.hostId === myId);

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
      if (room.value.state === 'lobby') {
         router.push({ name: 'lobby', query: { room: roomCode } });
      }
    }
  });

  const playersRef = collection(db, `rooms/${roomCode}/players`);
  unsubscribePlayers = onSnapshot(playersRef, (querySnap) => {
    const p: Player[] = [];
    querySnap.forEach((d) => p.push(d.data() as Player));
    players.value = p.sort((a, b) => b.score - a.score);
  });

  initConfetti();
});

onUnmounted(() => {
  if (unsubscribeRoom) unsubscribeRoom();
  if (unsubscribePlayers) unsubscribePlayers();
});

const playAgain = async () => {
    if (!isHost.value) return;
    const roomRef = doc(db, 'rooms', roomCode);
    await updateDoc(roomRef, {
        state: 'lobby',
        currentRound: 0,
        phase: null,
        question: null,
        propositions: [],
        readyPlayers: []
    });
};

const goHome = () => {
    router.push('/');
};

// Confetti Script
const initConfetti = () => {
    setTimeout(() => {
        const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces: any[] = [];
        const colors = ['#ab008f', '#004ced', '#caa900', '#191b25'];
        
        for (let i = 0; i < 150; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 10 + 5,
                h: Math.random() * 20 + 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                vy: Math.random() * 3 + 2,
                vx: Math.random() * 2 - 1,
                rot: Math.random() * 360,
                rotSpeed: Math.random() * 5 - 2.5
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;
            pieces.forEach(p => {
                p.y += p.vy;
                p.x += p.vx;
                p.rot += p.rotSpeed;
                
                if (p.y < canvas.height) active = true;

                ctx.save();
                ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
                ctx.rotate(p.rot * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            if (active) requestAnimationFrame(animate);
        };
        animate();
    }, 100);
};
</script>

<template>
  <div class="min-h-screen flex flex-col relative bg-surface overflow-x-hidden" v-if="room">
    <canvas id="confetti-canvas" class="fixed top-0 left-0 w-full h-full pointer-events-none z-50"></canvas>

    <header class="bg-surface/90 backdrop-blur-md flex justify-between items-center w-full px-gutter h-20 max-w-7xl mx-auto border-b-4 border-on-surface z-40 sticky top-0">
      <img src="@/assets/logo.svg" alt="Fictio Logo" class="h-10 w-auto" />
    </header>

    <main class="flex-grow w-full max-w-4xl mx-auto px-gutter pt-8 pb-32 relative z-10">
      <div class="text-center mb-12">
        <h1 class="font-display-lg text-primary uppercase italic mb-2">Fin de partie !</h1>
        <p class="font-body-lg text-on-surface-variant">Les résultats sont là, qui domine le classement ?</p>
      </div>

      <!-- Podium Section -->
      <div v-if="players.length > 0" class="relative h-80 flex items-end justify-center gap-2 md:gap-6 mb-16">
        <!-- 2nd Place -->
        <div v-if="players[1]" class="flex flex-col items-center" style="width: 30%;">
          <div class="relative mb-4">
            <div :class="['w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-secondary brutal-shadow z-10 relative flex items-center justify-center text-3xl text-white font-bold', players[1].avatarColor]">{{ players[1].name.charAt(0).toUpperCase() }}</div>
            <div class="absolute -bottom-3 -right-3 bg-secondary text-on-secondary font-headline-sm w-8 h-8 rounded-full flex items-center justify-center border-2 border-black z-20">2</div>
          </div>
          <div class="font-label-bold mb-2">{{ players[1].name }}</div>
          <div class="w-full bg-secondary border-4 border-black rounded-t-xl h-32 flex justify-center pt-4 relative overflow-hidden">
            <div class="font-headline-md text-on-secondary">{{ players[1].score }}</div>
          </div>
        </div>
        
        <!-- 1st Place -->
        <div class="flex flex-col items-center z-10" style="width: 35%;">
          <div class="relative mb-4">
            <span class="material-symbols-outlined text-tertiary-fixed absolute -top-8 left-1/2 transform -translate-x-1/2 text-4xl" style="font-variation-settings: 'FILL' 1;">star</span>
            <div :class="['w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-primary-container brutal-shadow-lg z-10 relative flex items-center justify-center text-4xl text-white font-bold', players[0].avatarColor]">{{ players[0].name.charAt(0).toUpperCase() }}</div>
            <div class="absolute -bottom-4 -right-4 bg-primary-container text-on-primary font-display-lg-mobile w-10 h-10 rounded-full flex items-center justify-center border-2 border-black z-20">1</div>
          </div>
          <div class="font-headline-sm mb-2 text-primary">{{ players[0].name }}</div>
          <div class="w-full bg-primary-container border-4 border-black rounded-t-xl h-48 flex justify-center pt-4 relative overflow-hidden">
            <div class="font-display-lg-mobile text-on-primary">{{ players[0].score }}</div>
          </div>
        </div>

        <!-- 3rd Place -->
        <div v-if="players[2]" class="flex flex-col items-center" style="width: 30%;">
          <div class="relative mb-4">
            <div :class="['w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-tertiary-fixed brutal-shadow z-10 relative flex items-center justify-center text-3xl text-white font-bold', players[2].avatarColor]">{{ players[2].name.charAt(0).toUpperCase() }}</div>
            <div class="absolute -bottom-3 -right-3 bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm w-8 h-8 rounded-full flex items-center justify-center border-2 border-black z-20">3</div>
          </div>
          <div class="font-label-bold mb-2">{{ players[2].name }}</div>
          <div class="w-full bg-tertiary-fixed border-4 border-black rounded-t-xl h-24 flex justify-center pt-4 relative overflow-hidden">
            <div class="font-headline-md text-on-tertiary-fixed">{{ players[2].score }}</div>
          </div>
        </div>
      </div>

      <!-- Full Leaderboard -->
      <div class="bg-surface border-4 border-on-surface rounded-xl brutal-shadow-lg p-card-padding mb-12 relative overflow-hidden">
        <h2 class="font-headline-md mb-6 border-b-4 border-on-surface pb-4">Classement Complet</h2>
        <ul class="flex flex-col gap-4">
          <li v-for="(p, index) in players" :key="p.id" class="flex items-center justify-between p-4 bg-surface-variant border-2 border-on-surface rounded-lg">
            <div class="flex items-center gap-4 pl-2">
              <span class="font-headline-sm text-on-surface-variant w-6 text-center">{{ index + 1 }}</span>
              <div :class="['w-10 h-10 rounded-full border-2 border-on-surface flex items-center justify-center text-white font-bold', p.avatarColor]">{{ p.name.charAt(0).toUpperCase() }}</div>
              <span class="font-label-bold">{{ p.name }} <span v-if="p.id === myId">(Toi)</span></span>
            </div>
            <span class="font-headline-sm">{{ p.score }}</span>
          </li>
        </ul>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col md:flex-row gap-4 justify-center">
        <button v-if="isHost" @click="playAgain" class="btn-brutal bg-secondary text-on-secondary px-8 py-4 rounded-xl font-headline-sm flex items-center justify-center gap-2">
          Rejouer
          <span class="material-symbols-outlined">replay</span>
        </button>
        <button @click="goHome" class="btn-brutal bg-surface text-on-surface px-8 py-4 rounded-xl font-headline-sm flex items-center justify-center gap-2">
          Menu Principal
          <span class="material-symbols-outlined">home</span>
        </button>
      </div>

    </main>
  </div>
</template>
