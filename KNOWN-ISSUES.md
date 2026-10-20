# Known issues

Check here before filing. Known and being worked on.

- The ROOM reverb can leave a faint high-pitched ring in its tail after a sharp hit such as a snare
- Under the heaviest possible load (every voice of every Part playing, all effects on), a big chord landing at once can cause a single tiny click
- PreenFM3s with the newer "1.6 - 100" main board are detected, and their knobs and buttons should work, but this hasn't been tried on that board yet. If yours is one, please tell us how it goes (SETTINGS › SYSTEM › ABOUT shows the board next to the chip revision)
- Push encoders (SETTINGS › SYSTEM › PUSH ENCODERS): push to jump a value to its default, push and turn for fine steps. Untested on push-encoder hardware so far; reports welcome
- On the FILTER page, the picture for CLEAN's NOTCH2 mode is a sketch of the response, not the filter's real response
<!-- 0.2.0 final pass: drop the NOTCH2 line if #631 is fixed before release. Re-check every item above against 0.2.0, and add any known issue of TAPE (#476), FX in the filter (#614) and VA's modes (#602, #682, #683). -->

## Not a bug: hum when powered over USB

If you hear a faint buzz or whine with the PreenFM3 powered over USB from the same computer your audio interface is connected to, that's a ground loop between the two. Power the PreenFM3 from its 9 V DC supply (or use a USB isolator) and it goes away.
