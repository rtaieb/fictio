<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getRandomPseudo, generateId } from '@/utils/helpers';

const router = useRouter();
const route = useRoute();

const pseudo = ref('');
const roomCode = ref('');

onMounted(() => {
  pseudo.value = localStorage.getItem('pseudo') || getRandomPseudo();
  const codeParam = route.query.room as string;
  if (codeParam) {
    roomCode.value = codeParam.toUpperCase();
  }
});

const rollPseudo = () => {
  pseudo.value = getRandomPseudo();
};

const joinOrCreate = () => {
  if (!pseudo.value.trim()) return;
  localStorage.setItem('pseudo', pseudo.value.trim());
  
  const finalCode = (roomCode.value || generateId()).toUpperCase();
  router.push({ name: 'lobby', query: { room: finalCode } });
};
</script>

<template>
  <div class="w-full flex flex-col items-center justify-center space-y-12">
    <!-- Giant Logo Centerpiece -->
    <div class="text-center w-full max-w-md mx-auto relative group">
      <!-- Decorative background elements -->
      <div class="absolute -top-10 -left-10 w-20 h-20 bg-tertiary-fixed rounded-full border-3 border-black shadow-[4px_4px_0_0_#000000] -z-10 group-hover:scale-110 transition-transform duration-300"></div>
      <div class="absolute -bottom-6 -right-6 w-16 h-16 bg-primary-fixed rounded-none border-3 border-black shadow-[4px_4px_0_0_#000000] rotate-12 -z-10 group-hover:-rotate-12 transition-transform duration-300"></div>
      <h1 class="font-display-lg md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary italic uppercase tracking-tighter" style="-webkit-text-stroke: 2px #000; text-shadow: 6px 6px 0px #000;">
        FICTIO
      </h1>
      <p class="font-label-bold text-label-bold text-on-surface mt-unit tracking-widest uppercase">
        Le jeu de bluff ultime
      </p>
    </div>

    <!-- Action Area -->
    <div class="w-full max-w-md space-y-8 bg-white border-[3px] border-black p-card-padding rounded-lg shadow-[8px_8px_0_0_#000000] relative">
      
      <!-- Pseudo Input -->
      <div class="w-full space-y-2">
        <label for="pseudo" class="block font-headline-sm text-headline-sm text-center">Ton pseudo</label>
        <div class="flex space-x-2">
          <input 
            type="text" 
            id="pseudo" 
            v-model="pseudo"
            class="flex-grow input-brutal text-center font-body-lg px-4 py-3"
            placeholder="Ex: Gédéon"
          />
          <button @click="rollPseudo" class="btn-brutal bg-tertiary-fixed text-on-surface px-4 rounded-xl shrink-0" title="Aléatoire">
            <span class="material-symbols-outlined">casino</span>
          </button>
        </div>
      </div>

      <!-- Create Game Button -->
      <div class="w-full">
        <button @click="joinOrCreate" v-if="!roomCode" class="w-full flex items-center justify-center space-x-2 bg-secondary text-on-secondary rounded-full font-headline-sm text-headline-sm px-6 py-4 btn-brutal">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">add_circle</span>
          <span>Créer une partie</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="flex items-center space-x-4 my-6">
        <div class="flex-grow h-[3px] bg-black"></div>
        <span class="font-label-bold text-label-bold text-on-surface uppercase">OU</span>
        <div class="flex-grow h-[3px] bg-black"></div>
      </div>

      <!-- Join Game Section -->
      <div class="w-full space-y-4">
        <label class="block font-headline-sm text-headline-sm text-center" for="room-code">
          Rejoindre une salle
        </label>
        <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <input 
            type="text" 
            id="room-code" 
            v-model="roomCode"
            maxlength="4" 
            class="flex-grow input-brutal text-center font-display-lg text-display-lg-mobile uppercase tracking-widest px-4 py-3 placeholder:text-outline-variant uppercase" 
            placeholder="CODE" 
            style="min-height: 64px;"
            @keyup.enter="joinOrCreate"
          />
          <button @click="joinOrCreate" :disabled="roomCode.length !== 4" class="md:w-32 flex items-center justify-center bg-primary-container text-on-primary-container rounded-full font-headline-sm text-headline-sm px-6 py-4 btn-brutal shrink-0">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">login</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
