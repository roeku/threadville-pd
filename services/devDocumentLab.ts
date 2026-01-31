import { CaseFile, EvidenceType } from '../types';
import { generateDocumentEvidence, templates, DocumentTemplateSpec } from './documentTemplates';

// Simple sample data per template to render fields and text blocks.
const sampleData: Record<string, Record<string, any>> = {
  'case-file-cover': {
    caseNumber: 'COLD-1974-009',
    title: 'The Midnight Paradox',
    leadInvestigator: 'Det. R. Oons',
    assignedTeam: ['Sgt. Nguyen', 'Tech. Alvarez'],
    startDate: '1974-02-11',
  },
  'search-warrant': {
    header: 'SEARCH WARRANT',
    caseNumber: 'COLD-1974-009',
    court: 'Threadville Magistrates Court',
    judge: 'Hon. J. Verbeck',
    affiant: 'Det. S. Mallard',
    address: 'Sterling Manor, 14 Old Quarry Rd',
    properties: ['Wall safe contents', 'Bronze paperweight', 'Stationery drawer', 'Personal correspondence'],
    dateIssued: '1974-02-10',
    validUntil: '1974-02-17',
  },
  'incident-report': {
    header: 'POLICE DEPARTMENT',
    subtitle: 'INCIDENT REPORT',
    reportNumber: 'IR-74-2219',
    officer: 'Officer C. Rios',
    badge: '#4127',
    incidentType: 'Suspicious Death - Homicide',
    location: 'Sterling Manor Study, 14 Old Quarry Rd',
    datetime: '1974-02-10 22:45',
    narrative: 'Responded to call from house staff reporting unresponsive male. Arrived 22:47. Room locked from inside; victim found with head trauma. Noted missing paperweight from desk and open wall safe. Scene secured and CID notified.',
    supervisor: 'Sgt. M. Nguyen',
  },
  'lab-submission-form': {
    caseNumber: 'COLD-1974-009',
    submitter: 'Tech. Alvarez',
    items: [
      { itemId: 'ev_bronze_paperweight', description: 'Bronze paperweight with blood', requestedTests: 'DNA, Prints' },
      { itemId: 'ev_blood_swab', description: 'Blood swab from weapon', requestedTests: 'Blood typing' },
    ],
    date: '1974-02-11',
  },
  'autopsy-report': {
    header: 'OFFICE OF THE MEDICAL EXAMINER',
    subtitle: 'AUTOPSY REPORT',
    caseNumber: 'ME-74-0211',
    decedent: 'Lord Alistair Sterling',
    date: '1974-02-11',
    examiner: 'Dr. S. Mallard, M.D.',
    externalFindings: 'Linear contusion to left temporal region measuring 4.2cm. No defensive wounds. Lividity consistent with supine position.',
    internalFindings: 'Depressed fracture of left temporal bone with underlying epidural hematoma (approx. 120ml). Brain edema present.',
    toxicology: 'Pending - Blood alcohol: 0.04% (legal limits). No immediate evidence of poisons or narcotics.',
    cause: 'Blunt force trauma to head',
    manner: 'Homicide',
  },
  'bank-statement': {
    bankName: 'Sterling Bank & Trust',
    accountName: 'Alistair Sterling',
    accountNumber: '****-2211',
    period: 'Jan 1974',
    transactions: [
      { date: '1974-01-04', description: 'Wire Transfer - Monaco', amount: -15000, balance: 82000 },
      { date: '1974-01-28', description: 'Cash Withdrawal', amount: -3000, balance: 79000 },
    ],
  },
  'email-printout': {
    from: 'g.holloway@protonmail.com',
    to: 'a.sterling@sterlingmanor.uk',
    subject: 'Urgent: debts',
    date: '1974-02-09T18:02:00Z',
    body: 'Alistair, the lenders are pressing. If we settle by Sunday, I can delay proceedings.',
    attachments: ['Statement.pdf'],
  },
  'boarding-pass': {
    airline: 'British Rail',
    passenger: 'Eleanor Sterling',
    flight: '10:00 PM SOUTHERN',
    date: '1974-02-10',
    from: 'Threadville',
    to: 'London',
    seat: 'C12',
    boardingTime: '21:40',
  },
  'news-clipping': {
    headline: 'Storm Grounds Trains Across Region',
    byline: 'By Margaret Vance',
    date: '1974-02-10',
    body: 'Heavy snowfall forced the cancellation of several late-night departures, including the 10 PM southbound line from Threadville.',
  },
  'crime-scene-sketch': {
    location: 'Sterling Study',
    sketchNotes: 'Desk at center, window facing garden, safe behind painting.',
    legend: ['A: Victim', 'B: Paperweight', 'C: Window'],
    measurements: ['Window to desk: 1.4m', 'Desk to door: 3.2m'],
  },
  'handwritten-note': {
    author: 'G',
    body: 'Alistair,\n\nYou cannot hide from what you owe. The lenders know where you are.\n\nMidnight. Study.\n\n— G',
    date: '1974-02-09',
  },
  'press-release': {
    title: 'Police Investigate Death at Sterling Manor',
    agency: 'Threadville Police Department',
    date: '1974-02-11',
    summary: 'Detectives are investigating a suspicious death at the Sterling estate. No further details at this time.',
  },
  'interview-transcript': {
    source: 'Tape A12',
    timestampRange: '23:10–23:51',
    speakers: [
      { name: 'Det. Mallard', line: 'Let me walk through this again, Mrs. Sterling. You claim you left the house at 9:30 PM.' },
      { name: 'Eleanor', line: 'That is correct. I had my coat and purse. I was going to catch the 10:00 PM train to London.' },
      { name: 'Det. Mallard', line: 'And you walked to the station alone?' },
      { name: 'Eleanor', line: 'Yes. It is only a fifteen-minute walk. The snow was heavy, but I... I needed to leave.' },
      { name: 'Det. Mallard', line: 'Needed to leave. Your husband didn\'t want you going?' },
      { name: 'Eleanor', line: 'That is not—we had discussed it. He knew I was visiting my sister in town. It was planned.' },
      { name: 'Det. Mallard', line: 'Yet you came back around 10:45 PM, you say. What happened at the station?' },
      { name: 'Eleanor', line: 'I waited on the platform. The train was supposed to arrive at 10:00, and it did. I watched it pull in. But when I tried to board, I realized my purse—my ticket and money were in it.' },
      { name: 'Det. Mallard', line: 'Your purse. The one you were carrying when you left.' },
      { name: 'Eleanor', line: 'I thought I had it, but... I must have left it on the hall table. I panicked. I walked back.' },
      { name: 'Det. Mallard', line: 'The train was on time? 10:00 PM exactly?' },
      { name: 'Eleanor', line: 'Yes, I... it arrived. The platform was crowded.' },
      { name: 'Det. Mallard', line: 'Mrs. Sterling, we have a railway manifest. The 10:00 PM southbound was cancelled that evening due to heavy snow.' },
      { name: 'Eleanor', line: 'That is... no, I saw it arrive. There must be an error in your records.' },
      { name: 'Det. Mallard', line: 'An error. So if there was no train, what train did you see?' },
      { name: 'Eleanor', line: 'I—perhaps it was the 9:15. I may have lost track of the time. The snow made everything dark.' },
      { name: 'Det. Mallard', line: 'You "may have lost track." But you found your way home by 10:45 and found your husband on the floor. When you found him, what was his condition?' },
      { name: 'Eleanor', line: 'He was cold. Not breathing. There was blood on the carpet. I screamed.' },
      { name: 'Det. Mallard', line: 'You screamed. Yet the staff heard nothing until you called for help at 10:47 PM.' },
      { name: 'Eleanor', line: 'I was... I was in shock. I ran to the phone.' },
      { name: 'Det. Mallard', line: 'One last thing. The paperweight—the bronze one that sat on his desk. It\'s missing. You know the one?' },
      { name: 'Eleanor', line: 'I... I have seen it, yes.' },
      { name: 'Det. Mallard', line: 'You have "seen" it. Did you move it at any point that evening?' },
      { name: 'Eleanor', line: 'No. I never went near the study. I left the house to go to the station.' },
    ],
  },
  'transcript-excerpt': {
    source: 'Tape A12',
    speakers: [
      { name: 'Det. Mallard', line: 'Let me walk through this again, Mrs. Sterling. You claim you left the house at 9:30 PM.' },
      { name: 'Eleanor', line: 'That is correct. I had my coat and purse. I was going to catch the 10:00 PM train to London.' },
      { name: 'Det. Mallard', line: 'And you walked to the station alone?' },
      { name: 'Eleanor', line: 'Yes. It is only a fifteen-minute walk. The snow was heavy, but I... I needed to leave.' },
      { name: 'Det. Mallard', line: 'Needed to leave. Your husband didn\'t want you going?' },
      { name: 'Eleanor', line: 'That is not—we had discussed it. He knew I was visiting my sister in town. It was planned.' },
      { name: 'Det. Mallard', line: 'Yet you came back around 10:45 PM, you say. What happened at the station?' },
      { name: 'Eleanor', line: 'I waited on the platform. The train was supposed to arrive at 10:00, and it did. I watched it pull in. But when I tried to board, I realized my purse—my ticket and money were in it.' },
      { name: 'Det. Mallard', line: 'Your purse. The one you were carrying when you left.' },
      { name: 'Eleanor', line: 'I thought I had it, but... I must have left it on the hall table. I panicked. I walked back.' },
      { name: 'Det. Mallard', line: 'The train was on time? 10:00 PM exactly?' },
      { name: 'Eleanor', line: 'Yes, I... it arrived. The platform was crowded.' },
      { name: 'Det. Mallard', line: 'Mrs. Sterling, we have a railway manifest. The 10:00 PM southbound was cancelled that evening due to heavy snow.' },
      { name: 'Eleanor', line: 'That is... no, I saw it arrive. There must be an error in your records.' },
      { name: 'Det. Mallard', line: 'An error. So if there was no train, what train did you see?' },
      { name: 'Eleanor', line: 'I—perhaps it was the 9:15. I may have lost track of the time. The snow made everything dark.' },
      { name: 'Det. Mallard', line: 'You "may have lost track." But you found your way home by 10:45 and found your husband on the floor. When you found him, what was his condition?' },
      { name: 'Eleanor', line: 'He was cold. Not breathing. There was blood on the carpet. I screamed.' },
      { name: 'Det. Mallard', line: 'You screamed. Yet the staff heard nothing until you called for help at 10:47 PM.' },
      { name: 'Eleanor', line: 'I was... I was in shock. I ran to the phone.' },
      { name: 'Det. Mallard', line: 'One last thing. The paperweight—the bronze one that sat on his desk. It\'s missing. You know the one?' },
      { name: 'Eleanor', line: 'I... I have seen it, yes.' },
      { name: 'Det. Mallard', line: 'You have "seen" it. Did you move it at any point that evening?' },
      { name: 'Eleanor', line: 'No. I never went near the study. I left the house to go to the station.' },
    ],
    timestampRange: '23:10–23:51',
  },
  'texture-base-plain': {
    title: 'Texture Base - Plain',
    notes: 'Use this for baseline render checks.',
  },
};

function fallbackData(template: DocumentTemplateSpec): Record<string, any> {
  const out: Record<string, any> = {};
  template.fields.forEach((f, i) => {
    if (f.type === 'list') {
      out[f.key] = [`${f.label || f.key} item 1`, `${f.label || f.key} item 2`];
    } else if (f.type === 'table' && f.columns) {
      out[f.key] = [
        Object.fromEntries(f.columns.map((c) => [c.key, `${c.label || c.key} 1`])),
        Object.fromEntries(f.columns.map((c) => [c.key, `${c.label || c.key} 2`])),
      ];
    } else {
      out[f.key] = `${f.label || f.key} sample ${i + 1}`;
    }
  });
  return out;
}

export function generateDocLabCase(): CaseFile {
  const paperWidth = 0.24;
  const paperDepth = 0.18;
  const perRow = 4;

  const entities = templates.map((tpl, idx) => {
    const data = sampleData[tpl.id] || fallbackData(tpl);
    const row = Math.floor(idx / perRow);
    const col = idx % perRow;
    const position: [number, number, number] = [
      -0.45 + col * paperWidth,
      0.90 + row * 0.001,
      -0.35 + row * paperDepth,
    ];

    return generateDocumentEvidence(tpl, data, {
      id: `lab_${tpl.id}`,
      position,
      rotation: [0, (Math.random() - 0.5) * 0.2, 0],
    });
  });

  const suspects = [
    {
      id: 'lab_suspect_1',
      name: 'Doc Render',
      bio: 'Placeholder for lab mode.',
      notes: 'Used for dev harness only.',
      bloodType: 'O+',
      dnaSequence: 'ATGC-ATGC-ATGC',
      fingerprintPattern: 'LOOP-LOOP-ARCH',
    },
    {
      id: 'lab_suspect_2',
      name: 'Texture Check',
      bio: 'Placeholder.',
      notes: 'Ensures type coverage.',
      bloodType: 'A-',
      dnaSequence: 'CGTA-CGTA-CGTA',
      fingerprintPattern: 'WHORL-WHORL-WHORL',
    },
    {
      id: 'lab_suspect_3',
      name: 'Layout Pass',
      bio: 'Placeholder.',
      notes: 'Keeps schema valid.',
      bloodType: 'B+',
      dnaSequence: 'TTAG-TTAG-TTAG',
      fingerprintPattern: 'ARCH-LOOP-WHORL',
    },
  ];

  return {
    caseId: 'DOC-LAB',
    title: 'Document Lab Harness',
    briefing: 'Dev harness to view every document template, texture, and layout on the desk. Drag, pin, and inspect to verify alignment and transparency.',
    entities,
    suspects,
    solution: {
      culpritId: 'lab_suspect_1',
      weaponId: entities[0]?.id || 'lab_unknown',
      motive: 'Testing only',
      reasoning: 'Document harness case.',
    },
  };
}
