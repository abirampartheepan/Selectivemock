/* ==========================================================================
   Written content registry. Each exam file calls defExam(id, {...}) with its
   five reading units, sixteen written Thinking Skills items and one writing
   task. Maths and the Thinking Skills puzzles are generated, so they need no
   entry here.
   ========================================================================== */
'use strict';

const CONTENT = {};
function defExam(id, c) { CONTENT[id] = c; }
