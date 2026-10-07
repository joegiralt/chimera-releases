# Known issues

Check here before filing. Known and being worked on.

- A filter turned up to self-oscillate (RES near max) keeps ringing after you let go of the key, on ALGO and MODAL
- A power cut in the middle of a save can leave the card's free space smaller (the old file still loads); the boot sweep is the fix in progress
- The USB console does not come up after a cold power-on; the synth plays normally, and a pass through OS UPGRADE brings it back until the next power cut
- A very faint hum (750 Hz) and whine (6.84 kHz) on the audio outputs in silence, about -96 dBFS
- If the audio DMA for output pairs 2 or 3 hits a transfer error, that pair goes silent until you restart
- ALGO INIT can peak past full scale (clip) through a loud reverb send or at MORPH B
