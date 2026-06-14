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
      await page.goto('http://localhost:5173/fictio/', { waitUntil: 'networkidle0' });
      
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
      await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('phase de bluff'), {timeout: 10000});
      
      // Type a bluff and click Soumettre
      await page.type('textarea', 'Ceci est mon bluff ' + Math.random());
      await page.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (let b of btns) {
              if (b.innerText.toUpperCase().includes('SOUMETTRE')) b.click();
          }
      });
      // Verify it changes state to 'En attente des autres joueurs...'
      await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('en attente des autres joueurs'), {timeout: 5000});
    }
    console.log("All players submitted their bluff successfully!");

    // Wait for Voting phase (checkFastForward should auto-skip)
    console.log("Waiting for voting phase...");
    for(let page of pages) {
      await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('quel est le vrai ?'), {timeout: 15000});
      
      // Submit vote
      await page.evaluate(() => {
          const buttons = document.querySelectorAll('main button');
          for (let b of buttons) {
              const text = b.innerText.toLowerCase();
              if (!b.disabled && !text.includes('ton bluff') && !text.includes('vote impossible')) {
                  b.click();
                  break;
              }
          }
      });
      await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('vote enregistré'), {timeout: 5000});
    }
    console.log("All players submitted their vote successfully!");

    // Wait for revealing phase
    console.log("Waiting for revealing phase...");
    for(let page of pages) {
      await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('dépouillement des votes...'), {timeout: 15000});
    }
    
    console.log("Waiting for truth to be revealed...");
    for(let page of pages) {
      await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('la vérité éclate !'), {timeout: 15000});
    }

    console.log("Test Passed! Basic flow, submission, voting, and revealing works.");

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
