// Check if the expiration time is within a day
export default function expiresSoon(expireAt) {
  if (typeof expireAt === 'undefined') return true;
  return (new Date(expireAt) - new Date()) < 1000 * 60 * 60 * 24;
}
