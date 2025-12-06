/**
 * Motivational Quotes for 75 Hard Challenge
 *
 * Provides daily motivational quotes that rotate based on the current day number.
 * Ensures each day gets a unique quote while maintaining consistency for the same day.
 */

export const COMPLETION_QUOTES = [
  "Small daily wins create massive transformations! 💪",
  "Discipline is choosing between what you want now and what you want most.",
  "You're building a stronger version of yourself today! 🔥",
  "Consistency is the bridge between goals and accomplishment.",
  "Every day completed is proof of your commitment! ✨",
  "Hard work beats talent when talent doesn't work hard.",
  "You're not just doing tasks, you're building character! 🌟",
  "Excellence is not an act, but a habit. Well done!",
  "Progress over perfection. You crushed it today! 💯",
  "The only bad workout is the one that didn't happen. You did it!",
  "Your future self is thanking you right now! 🙏",
  "Discipline equals freedom. Keep going!",
  "You're proving to yourself what you're capable of! 🚀",
  "Success is the sum of small efforts repeated daily.",
  "Another day, another victory! Keep the momentum! ⚡",
  "You're building unstoppable momentum!",
  "Mental toughness is earned, not given. You earned it today!",
  "The pain of discipline is lighter than the pain of regret.",
  "You showed up. You did the work. You won the day! 🏆",
  "Every rep, every page, every drop counts!",
  "You're not the same person who started this challenge! 💎",
  "Commitment means staying true even when it's hard.",
  "You're writing a success story, one day at a time! 📖",
  "The difference between ordinary and extraordinary is that little extra.",
  "You're building the life you want, task by task! 🎯",
  "Consistency compounds. Keep stacking wins!",
  "You're stronger than your excuses!",
  "Today's discipline is tomorrow's freedom! 🗽",
  "You're not just following a program, you're changing your life!",
  "The hardest step is showing up. You did it again! 👟",
  "Your dedication is your superpower!",
  "Champions are made in the daily grind! 💪",
  "You're building a reputation with yourself!",
  "The journey of 75 days is walked one day at a time.",
  "You're proving doubters wrong, including your old self! 🎖️",
  "Discipline is doing what needs to be done, even when you don't want to.",
  "Every task completed is a promise kept to yourself!",
  "You're not just surviving, you're thriving! 🌱",
  "The secret to getting ahead is getting started. You're ahead!",
  "Your consistency is inspiring! Keep leading by example! 👑",
  "Hard days build strong people!",
  "You're halfway there! Keep pushing! 🎉",
  "The pain you feel today is the strength you feel tomorrow.",
  "You're building an unbreakable mindset! 🧠",
  "Success is what happens when preparation meets opportunity!",
  "You're not just completing tasks, you're transforming! 🦋",
  "The best view comes after the hardest climb!",
  "You're creating the person you're becoming!",
  "Every day is a chance to be better. You took it! 📈",
  "You're building a legacy of discipline!",
  "The only way out is through. You're going through! 💥",
  "You're teaching yourself that you can do hard things!",
  "Your commitment is your competitive advantage!",
  "You're not just changing habits, you're changing your identity! 🎭",
  "The scoreboard doesn't lie. You won today!",
  "You're building muscle in places you can't see!",
  "Discipline is the soul of an army. You're an army of one! ⚔️",
  "You're proving that excuses don't build empires!",
  "Every completed day is a brick in your fortress of discipline! 🏰",
  "You're not just doing 75 Hard, you're becoming 75 Harder!",
  "The struggle you're in today is developing the strength you need tomorrow.",
  "You're writing your own comeback story! 📝",
  "Champions adjust. You adjusted and conquered!",
  "You're building a mindset that nothing can break! 🛡️",
  "The magic happens outside your comfort zone. You found it!",
  "You're not just finishing days, you're forging greatness! ⚒️",
  "Your consistency is your credibility!",
  "You're building a life others will admire! ✨",
  "The grind doesn't stop, and neither do you!",
  "You're turning I wish into I will into I did! 🎯",
  "You're not just changing your body, you're changing your mind!",
  "Every day conquered is confidence earned! 💪",
  "You're proving that commitment beats motivation!",
  "You're finishing what you started. That's rare. That's powerful! 🔥",
  "Congratulations! You've conquered 75 days of hard! 🎊🏆👑",
];

/**
 * Get a motivational quote based on the current day number
 * Uses modulo to cycle through quotes while ensuring the same day always gets the same quote
 *
 * @param dayNumber - Current day number (1-75)
 * @returns Motivational quote for the day
 */
export function getDailyQuote(dayNumber: number): string {
  const index = (dayNumber - 1) % COMPLETION_QUOTES.length;
  return COMPLETION_QUOTES[index];
}

/**
 * Get next day's preview quote
 * Useful for showing users what they'll see tomorrow
 *
 * @param currentDay - Current day number (1-75)
 * @returns Quote for the next day
 */
export function getNextDayQuote(currentDay: number): string {
  return getDailyQuote(currentDay + 1);
}
