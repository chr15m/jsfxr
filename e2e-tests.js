const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8000';

test.describe('jsfxr', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    await page.waitForFunction(() => typeof PARAMS !== 'undefined');
  });

  test.describe('Generator buttons', () => {
    const presets = [
      'pickupCoin', 'laserShoot', 'explosion', 'powerUp',
      'hitHurt', 'jump', 'click', 'blipSelect', 'synth', 'tone'
    ];

    for (const preset of presets) {
      test(`${preset} generates sound data`, async ({ page }) => {
        const buttonText = {
          pickupCoin: 'Pickup/coin',
          laserShoot: 'Laser/shoot',
          powerUp: 'Powerup',
          hitHurt: 'Hit/hurt',
          blipSelect: 'Blip/select',
        }[preset] || preset.charAt(0).toUpperCase() + preset.slice(1);

        await page.click(`button:has-text("${buttonText}")`);

        const hasSound = await page.evaluate(() => {
          return !!SOUND && !!SOUND.dataURI && SOUND.dataURI.length > 100;
        });
        expect(hasSound).toBe(true);

        const hasParams = await page.evaluate(() => {
          return !!PARAMS && typeof PARAMS.wave_type === 'number';
        });
        expect(hasParams).toBe(true);
      });
    }

    test('Random generates sound data', async ({ page }) => {
      await page.click('button:has-text("Random")');
      const hasSound = await page.evaluate(() => {
        return !!SOUND && !!SOUND.dataURI && SOUND.dataURI.length > 100;
      });
      expect(hasSound).toBe(true);
    });

    test('Mutate modifies parameters', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      const before = await page.evaluate(() => JSON.stringify(PARAMS));

      await page.click('button:has-text("Mutate")');
      const after = await page.evaluate(() => JSON.stringify(PARAMS));

      expect(before).not.toBe(after);
    });
  });

  test.describe('Waveform selection', () => {
    const waveforms = [
      { id: 'square', value: 0 },
      { id: 'sawtooth', value: 1 },
      { id: 'sine', value: 2 },
      { id: 'noise', value: 3 },
    ];

    for (const wf of waveforms) {
      test(`${wf.id} waveform can be selected`, async ({ page }) => {
        await page.click(`label[for="${wf.id}"]`);
        const waveType = await page.evaluate(() => PARAMS.wave_type);
        expect(waveType).toBe(wf.value);
      });
    }

    test('duty cycle sliders disable for sine wave', async ({ page }) => {
      await page.click('label[for="sine"]');
      const dutyDisabled = await page.evaluate(() => {
        return $('#p_duty').slider('option', 'disabled');
      });
      expect(dutyDisabled).toBe(true);
    });

    test('duty cycle sliders disable for noise wave', async ({ page }) => {
      await page.click('label[for="noise"]');
      const dutyDisabled = await page.evaluate(() => {
        return $('#p_duty').slider('option', 'disabled');
      });
      expect(dutyDisabled).toBe(true);
    });

    test('duty cycle sliders enable for square wave', async ({ page }) => {
      await page.click('label[for="sine"]');
      await page.click('label[for="square"]');
      const dutyDisabled = await page.evaluate(() => {
        return $('#p_duty').slider('option', 'disabled');
      });
      expect(dutyDisabled).toBe(false);
    });
  });

  test.describe('Sample rate selection', () => {
    const rates = [44100, 22050, 11025, 5512];

    for (const rate of rates) {
      test(`${rate} Hz can be selected`, async ({ page }) => {
        await page.click(`label[for="${rate}"]`);
        const sampleRate = await page.evaluate(() => PARAMS.sample_rate);
        expect(sampleRate).toBe(rate);
      });
    }
  });

  test.describe('Sample size selection', () => {
    test('8 bit can be selected', async ({ page }) => {
      await page.click('label[for="8"]');
      const sampleSize = await page.evaluate(() => PARAMS.sample_size);
      expect(sampleSize).toBe(8);
    });

    test('16 bit can be selected', async ({ page }) => {
      await page.click('label[for="16"]');
      const sampleSize = await page.evaluate(() => PARAMS.sample_size);
      expect(sampleSize).toBe(16);
    });
  });

  test.describe('Sliders', () => {
    test('volume slider changes sound volume', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      
      // Get initial state (default is 0.25 = slider value 250)
      const initialSliderVal = await page.evaluate(() => 
        $('#sound_vol').slider('value')
      );
      
      // Get slider element bounding box for drag calculations
      const slider = page.locator('#sound_vol');
      const box = await slider.boundingBox();
      
      // Drag to ~50% (500/1000)
      const startX = box.x + (initialSliderVal / 1000) * box.width;
      const targetX1 = box.x + 0.5 * box.width;
      const centerY = box.y + box.height / 2;
      
      await page.mouse.move(startX, centerY);
      await page.mouse.down();
      await page.mouse.move(targetX1, centerY);
      await page.mouse.up();
      await page.waitForTimeout(100);

      const paramVol1 = await page.evaluate(() => PARAMS.sound_vol);
      const sliderValue1 = await page.evaluate(() => 
        $('#sound_vol').slider('value')
      );
      expect(sliderValue1).toBeGreaterThan(400);
      expect(sliderValue1).toBeLessThan(600);
      expect(paramVol1).toBeGreaterThan(0.4);
      expect(paramVol1).toBeLessThan(0.6);

      // Drag back to ~25% (250/1000)
      const currentX = box.x + (sliderValue1 / 1000) * box.width;
      const targetX2 = box.x + 0.25 * box.width;
      
      await page.mouse.move(currentX, centerY);
      await page.mouse.down();
      await page.mouse.move(targetX2, centerY);
      await page.mouse.up();
      await page.waitForTimeout(100);

      const paramVol2 = await page.evaluate(() => PARAMS.sound_vol);
      const sliderValue2 = await page.evaluate(() => 
        $('#sound_vol').slider('value')
      );
      expect(sliderValue2).toBeGreaterThan(200);
      expect(sliderValue2).toBeLessThan(300);
      expect(paramVol2).toBeGreaterThan(0.2);
      expect(paramVol2).toBeLessThan(0.3);
    });

    test('signed sliders accept negative values', async ({ page }) => {
      const signedSliders = [
        'p_freq_ramp', 'p_freq_dramp', 'p_arp_mod', 'p_duty_ramp',
        'p_pha_offset', 'p_pha_ramp', 'p_lpf_ramp', 'p_hpf_ramp'
      ];

      for (const slider of signedSliders) {
        const min = await page.evaluate(
          (id) => $(`#${id}`).slider('option', 'min'),
          slider
        );
        expect(min).toBe(-1000);
      }
    });

    test('unsigned sliders have min 0', async ({ page }) => {
      const unsignedSliders = [
        'p_env_attack', 'p_env_sustain', 'p_env_punch', 'p_env_decay',
        'p_base_freq', 'p_freq_limit', 'p_vib_strength', 'p_vib_speed'
      ];

      for (const slider of unsignedSliders) {
        const min = await page.evaluate(
          (id) => $(`#${id}`).slider('option', 'min'),
          slider
        );
        expect(min).toBe(0);
      }
    });

    test('slider labels exist and display values', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      
      // Check that labels exist for key sliders
      const slidersWithUnits = [
        { id: 'p_env_attack', unit: 'sec' },
        { id: 'p_env_sustain', unit: 'sec' },
        { id: 'p_env_decay', unit: 'sec' },
        { id: 'p_base_freq', unit: 'Hz' },
        { id: 'sound_vol', unit: 'dB' },
      ];

      for (const { id, unit } of slidersWithUnits) {
        const labelText = await page.evaluate(
          (sliderId) => $(`label[for="${sliderId}"]`).text(),
          id
        );
        expect(labelText).toContain(unit);
      }
    });

    test('slider labels update when slider is moved', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      
      // Get initial label value for attack time
      const initialLabel = await page.evaluate(
        () => $('label[for="p_env_attack"]').text()
      );
      
      // Move the attack slider to max
      const slider = page.locator('#p_env_attack');
      const box = await slider.boundingBox();
      const startX = box.x + 10;
      const endX = box.x + box.width - 10;
      const centerY = box.y + box.height / 2;
      
      await page.mouse.move(startX, centerY);
      await page.mouse.down();
      await page.mouse.move(endX, centerY);
      await page.mouse.up();
      
      // Get updated label value
      const updatedLabel = await page.evaluate(
        () => $('label[for="p_env_attack"]').text()
      );
      
      expect(updatedLabel).not.toBe(initialLabel);
      expect(updatedLabel).toContain('sec');
    });
  });

  test.describe('URL hash / permalink', () => {
    test('share link updates when sound is generated', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      
      const shareHref = await page.evaluate(() => 
        document.getElementById('share').getAttribute('href')
      );
      
      expect(shareHref).toMatch(/^#[1-9A-HJ-NP-Za-km-z]+$/);
      expect(shareHref.length).toBeGreaterThan(10);
    });

    test('hash updates when URL already has hash', async ({ page }) => {
      // Navigate with an existing hash so the code will update location.hash
      await page.goto(BASE_URL + '/index.html#test');
      await page.waitForFunction(() => typeof PARAMS !== 'undefined');
      
      await page.click('button:has-text("Pickup/coin")');
      
      const hash = await page.evaluate(() => location.hash);
      
      // Hash should now be a valid B58 string (not #test anymore)
      expect(hash).toMatch(/^#[1-9A-HJ-NP-Za-km-z]+$/);
      expect(hash.length).toBeGreaterThan(10);
    });

    test('hash changes when different preset is selected', async ({ page }) => {
      await page.goto(BASE_URL + '/index.html#existing');
      await page.waitForFunction(() => typeof PARAMS !== 'undefined');
      
      await page.click('button:has-text("Pickup/coin")');
      const hash1 = await page.evaluate(() => location.hash);
      
      await page.click('button:has-text("Explosion")');
      const hash2 = await page.evaluate(() => location.hash);
      
      expect(hash1).not.toBe(hash2);
    });

    test('loading with hash restores parameters', async ({ page }) => {
      await page.click('button:has-text("Explosion")');
      
      const shareHref = await page.evaluate(() => 
        document.getElementById('share').getAttribute('href')
      );
      const originalParams = await page.evaluate(() => JSON.stringify(PARAMS));

      // Navigate with the hash from share link
      await page.goto(BASE_URL + '/index.html' + shareHref);
      await page.waitForFunction(() => typeof PARAMS !== 'undefined');

      const loadedParams = await page.evaluate(() => JSON.stringify(PARAMS));
      
      expect(loadedParams).toBe(originalParams);
    });

    test('loading with hash updates UI controls', async ({ page }) => {
      // Generate a sound first, then change waveform after
      // (presets overwrite wave_type, so must change after)
      await page.click('button:has-text("Pickup/coin")');
      await page.click('label[for="noise"]');
      
      const shareHref = await page.evaluate(() => 
        document.getElementById('share').getAttribute('href')
      );

      // Navigate fresh with the hash
      await page.goto(BASE_URL + '/index.html' + shareHref);
      await page.waitForFunction(() => typeof PARAMS !== 'undefined');

      // Verify the noise radio button is checked
      const noiseChecked = await page.isChecked('#noise');
      expect(noiseChecked).toBe(true);
    });

    test('permalink link has correct href', async ({ page }) => {
      await page.click('button:has-text("Jump")');
      const shareHref = await page.getAttribute('#share', 'href');
      
      expect(shareHref).toMatch(/^#[1-9A-HJ-NP-Za-km-z]+$/);
      expect(shareHref.length).toBeGreaterThan(10);
    });
  });

  test.describe('Copy code', () => {
    test('copy buffer contains B58 string', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      const copyValue = await page.inputValue('#copybuffer');
      expect(copyValue.length).toBeGreaterThan(10);
      const isValidB58 = /^[1-9A-HJ-NP-Za-km-z]+$/.test(copyValue);
      expect(isValidB58).toBe(true);
    });

    test('copy button copies to clipboard', async ({ context, page }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.click('button:has-text("Pickup/coin")');
      await page.click('button:has-text("Copy code")');

      const clipboard = await page.evaluate(() =>
        navigator.clipboard.readText()
      );
      const copyValue = await page.inputValue('#copybuffer');
      expect(clipboard).toBe(copyValue);
    });
  });

  test.describe('WAV download', () => {
    test('WAV link has data URI', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      const href = await page.getAttribute('#wav', 'href');
      expect(href).toMatch(/^data:audio\/wav;base64,/);
    });

    test('WAV filename matches preset', async ({ page }) => {
      await page.click('button:has-text("Explosion")');
      const download = await page.getAttribute('#wav', 'download');
      expect(download).toBe('explosion.wav');
    });
  });

  test.describe('JSON download', () => {
    test('JSON link has data URI with valid JSON', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      const href = await page.getAttribute('#json', 'href');
      expect(href).toMatch(/^data:text\/plain;charset=UTF-8,/);

      const jsonStr = decodeURIComponent(
        href.replace('data:text/plain;charset=UTF-8,', '')
      );
      const parsed = JSON.parse(jsonStr);
      expect(parsed).toHaveProperty('wave_type');
      expect(parsed).toHaveProperty('p_base_freq');
    });

    test('JSON filename matches preset', async ({ page }) => {
      await page.click('button:has-text("Powerup")');
      const download = await page.getAttribute('#json', 'download');
      expect(download).toBe('powerUp.json');
    });
  });

  test.describe('Serialize / Deserialize', () => {
    test('serialize button shows textarea with JSON', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      await page.click('button:has-text("Serialize")');

      const isVisible = await page.isVisible('#serialize');
      expect(isVisible).toBe(true);

      const textareaValue = await page.inputValue('textarea');
      const parsed = JSON.parse(textareaValue);
      expect(parsed).toHaveProperty('wave_type');
    });

    test('deserialize restores parameters from textarea', async ({ page }) => {
      const testParams = {
        oldParams: true,
        wave_type: 3,
        p_env_attack: 0.1,
        p_env_sustain: 0.2,
        p_env_punch: 0.3,
        p_env_decay: 0.4,
        p_base_freq: 0.5,
        p_freq_limit: 0,
        p_freq_ramp: 0,
        p_freq_dramp: 0,
        p_vib_strength: 0,
        p_vib_speed: 0,
        p_arp_mod: 0,
        p_arp_speed: 0,
        p_duty: 0,
        p_duty_ramp: 0,
        p_repeat_speed: 0,
        p_pha_offset: 0,
        p_pha_ramp: 0,
        p_lpf_freq: 1,
        p_lpf_ramp: 0,
        p_lpf_resonance: 0,
        p_hpf_freq: 0,
        p_hpf_ramp: 0,
        sound_vol: 0.25,
        sample_rate: 44100,
        sample_size: 8
      };

      await page.click('button:has-text("Serialize")');
      await page.fill('textarea', JSON.stringify(testParams));
      await page.click('button:has-text("Deserialize")');

      const waveType = await page.evaluate(() => PARAMS.wave_type);
      expect(waveType).toBe(3);

      const envAttack = await page.evaluate(() => PARAMS.p_env_attack);
      expect(envAttack).toBeCloseTo(0.1, 5);
    });
  });

  test.describe('File upload', () => {
    test('file input accepts JSON files', async ({ page }) => {
      const fixtureDir = path.join(__dirname, 'test-fixtures');
      if (!fs.existsSync(fixtureDir)) {
        fs.mkdirSync(fixtureDir);
      }

      const testParams = {
        oldParams: true,
        wave_type: 2,
        p_env_attack: 0.05,
        p_env_sustain: 0.15,
        p_env_punch: 0.25,
        p_env_decay: 0.35,
        p_base_freq: 0.45,
        p_freq_limit: 0,
        p_freq_ramp: 0,
        p_freq_dramp: 0,
        p_vib_strength: 0,
        p_vib_speed: 0,
        p_arp_mod: 0,
        p_arp_speed: 0,
        p_duty: 0,
        p_duty_ramp: 0,
        p_repeat_speed: 0,
        p_pha_offset: 0,
        p_pha_ramp: 0,
        p_lpf_freq: 1,
        p_lpf_ramp: 0,
        p_lpf_resonance: 0,
        p_hpf_freq: 0,
        p_hpf_ramp: 0,
        sound_vol: 0.25,
        sample_rate: 44100,
        sample_size: 8
      };

      const fixturePath = path.join(fixtureDir, 'test-sound.json');
      fs.writeFileSync(fixturePath, JSON.stringify(testParams));

      await page.setInputFiles('#open_save_impl', fixturePath);

      await page.waitForFunction(() => PARAMS.wave_type === 2);

      const waveType = await page.evaluate(() => PARAMS.wave_type);
      expect(waveType).toBe(2);

      const envAttack = await page.evaluate(() => PARAMS.p_env_attack);
      expect(envAttack).toBeCloseTo(0.05, 5);
    });
  });

  test.describe('Stats display', () => {
    test('file size is displayed', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      const fileSize = await page.textContent('#file_size');
      expect(fileSize).toMatch(/\d+kB/);
    });

    test('sample count is displayed', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      const samples = await page.textContent('#num_samples');
      expect(parseInt(samples)).toBeGreaterThan(0);
    });

    test('clipping count is displayed', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      const clipping = await page.textContent('#clipping');
      expect(parseInt(clipping)).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Play button', () => {
    test('play button regenerates sound', async ({ page }) => {
      await page.click('button:has-text("Pickup/coin")');
      const firstDataURI = await page.evaluate(() => SOUND.dataURI);

      await page.evaluate(() => {
        PARAMS.p_base_freq = 0.8;
      });

      await page.click('#export button:has-text("Play")');

      const secondDataURI = await page.evaluate(() => SOUND.dataURI);
      expect(firstDataURI).toBe(secondDataURI);
    });
  });
});
