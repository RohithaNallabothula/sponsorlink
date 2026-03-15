async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/users');
    const data = await res.json();
    console.log('Users found:', data);
  } catch (e) {
    console.error('Fetch failed:', e);
  }
}
test();
