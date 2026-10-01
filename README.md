# Selective Exam Practice

100 full practice exams for the NSW Selective High School Placement Test: Reading, Thinking Skills, Mathematical Reasoning and Writing, at three levels (40 Easy, 40 Medium, 20 Hard).

The whole site builds into one file, `dist/index.html`, which can be hosted anywhere (for example GitHub Pages) or opened directly in a browser.

## How the exams are made

- **Maths and Thinking Skills puzzles** come from question generators (`src/gen/`). Each exam builds the same questions every time, and the answers are worked out by code. `tools/dedupe.js` makes sure no question appears twice anywhere in the 100 exams.
- **Reading passages, Thinking Skills argument questions and Writing tasks** are written by hand, one file per exam in `src/content/exams/`. Exams without a content file show Maths only until their file is added.
- All passages and questions are original. The official NSW practice tests and the Alpha One sample papers were used only as a guide to question types, wording style and difficulty.

## Building

```
node tools/build.js          # re-rolls any repeated questions, then writes dist/index.html
node tools/check-gen.js      # runs every generator 1200 times and checks the output
node tools/check-content.js  # checks the written content of every exam file
node tools/check-exams.js    # builds every test of every exam and checks it
```

## Adding the next batch of exams

Copy an existing file in `src/content/exams/` (for example `E01.js`), rename it to the new exam id (`E05`, `M05`, `H03`…), replace the content, then run the three checks and the build.
