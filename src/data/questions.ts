export type GameQuestion = {
  text: string;
  trueAnswer: string;
  type: 'word' | 'question';
};

export const questions: GameQuestion[] = [
  // Mots compliqués
  { text: "Apophénie", trueAnswer: "Tendance à percevoir des liens significatifs entre des éléments sans rapport.", type: "word" },
  { text: "Callipyge", trueAnswer: "Qui a des fesses harmonieuses.", type: "word" },
  { text: "Nyctalope", trueAnswer: "Qui a la faculté de voir dans la pénombre.", type: "word" },
  { text: "Ultracrépidarianisme", trueAnswer: "Fait de donner son avis sur des sujets sans avoir de compétence.", type: "word" },
  { text: "Palingénésie", trueAnswer: "Retour à la vie, renaissance.", type: "word" },
  { text: "Zinzolin", trueAnswer: "Couleur d'un violet rougeâtre.", type: "word" },
  { text: "Agélaste", trueAnswer: "Personne qui ne rit jamais.", type: "word" },
  { text: "Myrmécophile", trueAnswer: "Qui aime et vit avec les fourmis.", type: "word" },
  { text: "Arachibutyrophobie", trueAnswer: "Peur d'avoir du beurre de cacahuète collé au palais.", type: "word" },
  { text: "Cacographie", trueAnswer: "Mauvaise écriture, remplie de fautes d'orthographe.", type: "word" },
  { text: "Borborygme", trueAnswer: "Bruit produit par le brassage des gaz et des liquides dans l'intestin.", type: "word" },
  { text: "Apophtegme", trueAnswer: "Parole mémorable ayant une valeur de maxime.", type: "word" },
  
  // Questions compliquées (sans réponses oui/non ou numériques)
  { text: "Quelle est la particularité physique du cœur de la crevette ?", trueAnswer: "Il est situé dans sa tête.", type: "question" },
  { text: "De quelle couleur est la sueur de l'hippopotame ?", trueAnswer: "Rose ou rouge sang.", type: "question" },
  { text: "Quel est le principal composant de la corne de rhinocéros ?", trueAnswer: "La kératine (comme nos ongles et cheveux).", type: "question" },
  { text: "Qu'est-ce qui donne sa couleur rose au flamant rose ?", trueAnswer: "Son alimentation (crevettes, crevettes grises et algues).", type: "question" },
  { text: "Quelle partie du corps humain ne peut pas guérir d'elle-même ?", trueAnswer: "L'émail des dents.", type: "question" },
  { text: "Quel animal a des empreintes digitales presque identiques à celles de l'homme ?", trueAnswer: "Le koala.", type: "question" },
  { text: "Comment s'appelle le phénomène lumineux naturel observable dans le ciel de l'hémisphère sud ?", trueAnswer: "L'aurore australe.", type: "question" },
  { text: "Quel organe le requin peut-il faire sortir de sa bouche pour se nettoyer ?", trueAnswer: "Son estomac.", type: "question" },
  { text: "Qu'utilise la loutre de mer comme outil pour ouvrir les coquillages ?", trueAnswer: "Une petite pierre qu'elle garde sur son ventre.", type: "question" },
  { text: "Que crachent les lamas pour se défendre lorsqu'ils se sentent menacés ?", trueAnswer: "Le contenu de leur estomac (des sucs gastriques).", type: "question" },
];

export function getRandomQuestion(): GameQuestion {
  return questions[Math.floor(Math.random() * questions.length)];
}
