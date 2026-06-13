const puppeteer = require('puppeteer-core');

async function runTests() {
  console.log("Starting E2E Tests with 4 players for Fictio...");
  
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new",
    args: ['--window-size=800,600']
  });

  const pages = [];
  const roomCode = 'F' + Math.random().toString(36).substring(2, 5).toUpperCase();

  try {
    for (let i = 1; i <= 4; i++) {
      console.log(`Player ${i} joining...`);
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      page.on('console', msg => console.log(`PAGE ${i} LOG:`, msg.text()));
      page.on('pageerror', err => console.log(`PAGE ${i} ERROR:`, err.toString()));
      pages.push(page);
      
      // Navigate
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
      
      // Join
      await page.type('#pseudo', `Player${i}`);
      await page.evaluate(() => document.getElementById('room-code').value = '');
      await page.type('#room-code', roomCode);
      
      // Click Join
      const joinButtons = await page.$$('button');
      // The join button is the last one in HomeView
      await joinButtons[1].click();
      
      // Wait for lobby to render
      await page.waitForFunction(() => document.body.innerText.includes('Joueurs'), {timeout: 10000});
    }

    console.log("All 4 players joined the lobby.");
    const hostPage = pages[0];
    
    // Start Game
    console.log("Host is starting the game...");
    const buttons = await hostPage.$$('button');
    // find the button that contains "Lancer la partie"
    await hostPage.evaluate(() => {
        const btns = document.querySelectorAll('button');
          for (let b of btns) {
              if (b.innerText.toUpperCase().includes('LANCER LA PARTIE')) b.click();
          }
    });
    
    // Everyone should see GameView (Phase de Bluff)
    for(let page of pages) {
      await page.waitForFunction(() => document.body.innerText.includes('Phase de Bluff'), {timeout: 10000});
      
      // Type a bluff and click Soumettre
      await page.type('textarea', 'Ceci est mon bluff ' + Math.random());
      await page.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (let b of btns) {
              if (b.innerText.toUpperCase().includes('SOUMETTRE')) b.click();
          }
      });
      // Verify it changes state to 'En attente des autres joueurs...'
      await page.waitForFunction(() => document.body.innerText.includes('En attente des autres joueurs'), {timeout: 5000});
    }
    console.log("All players submitted their bluff successfully!");

    console.log("Test Passed! Basic flow and submission works.");

  } catch (error) {
    console.error("TEST FAILED:", error);
    try {
      if (pages.length > 0) {
        await pages[0].screenshot({path: 'test_failure.png'});
        console.log("Screenshot saved to test_failure.png");
      }
    } catch(e) {}
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
