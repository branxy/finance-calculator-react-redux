export default function getTodayDate() {
  const today = new Date().toISOString().split("T")[0]
  return today
}
