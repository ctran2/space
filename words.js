// Simple English words for kids, spoken out loud during play.
const Words = (() => {
  const SHOUTS = {
    alien: ["Boom!", "Nice shot!", "Got it!", "Yes!", "Wow!", "Cool!", "Bye bye!", "Zap!", "Hooray!", "Good shot!", "Lovely", "You got it!", "Yay!", "Awesome!", "Great job!", "Fantastic!", "Amazing!", "Excellent!", "Super!"],
    cleared: ["Great job!", "Well done!", "Super!", "Awesome!"],
    hit: ["Oh no!", "Watch out!", "Oops!", "Ouch!", "Uh oh!", "Be careful!", "Keep going!", "You can do it!", "Try again!", "Dodge!"],
    over: [
      "Game over. Good try!",
      "Game over. Nice playing!",
      "Game over. Let's play again!",
      "Game over. You did great!",
      "Game over. So close!",
      "Game over. Try one more time!",
    ],
  };
  const NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  return {
    shout: (event) => pick(SHOUTS[event]),
    levelIntro: (level) => `Level ${NUMBERS[level] || level}!`,
  };
})();
