import { Wrapper } from './types';

export const CASE_DATA: Wrapper[] = [
    {
        "title": "The HOA Homicide: Death in the Mulch",
        "content": {
            "caseId": "CASE-1770355467039",
            "title": "The HOA Homicide: Death in the Mulch",
            "briefing": "In the hyper-exclusive gated community of Gilded Oaks, lawn care is a religion and compliance is mandatory. At 6:00 AM this morning, Arthur 'Artie' Penhaligon, the tyrannical President of the Homeowners Association, was discovered face-down in his own award-winning, premium black mulch. Artie was notorious for patrolling the neighborhood with a ruler to measure grass height and issuing fines for infractions as minor as leaving a garden hose uncoiled.",
            "difficulty": "Hard",
            "suspects": [
                {
                    "id": "S1",
                    "name": "Elena Rosales",
                    "bio": "Landscape Architect. Artie threatened to sue her for planting 'non-native' hydrangeas that violated subsection 4C of the bylaws.. Alibi: Claims she left the house at 5:00 AM to go to the 24-hour nursery before the morning rush.",
                    "notes": "Landscape Architect. Defensive about her art. Hates arbitrary rules.",
                    "bloodType": "A+",
                    "dnaSequence": "TTCA-CCCA-ATCA-AAAA",
                    "fingerprintPattern": "LOOP-ARCH-WHORL",
                    "photoUrl": "https://picsum.photos/id/64/400/500",
                },
                {
                    "id": "S2",
                    "name": "Kenji Sato",
                    "bio": "Tech Entrepreneur. Artie issued a stop-work order on Kenji's half-built infinity pool, costing him $50,000 in contractor delays.. Alibi: Claims he was live-streaming a video game marathon from 2:00 AM to 7:00 AM and only stepped away to use the bathroom.",
                    "notes": "Tech Entrepreneur. Arrogant, twitchy, addicted to caffeine and validation.",
                    "bloodType": "A-",
                    "dnaSequence": "CGGG-CCCT-TCTC-GATC",
                    "fingerprintPattern": "WHORL-LOOP-ARCH",
                    "photoUrl": "https://picsum.photos/id/91/400/500",
                },
                {
                    "id": "S3",
                    "name": "Sarah Jenkins",
                    "bio": "Lifestyle Vlogger. Artie was fining her daily for 'operating a commercial business' (filming) on residential property.. Alibi: Claims she was setting up her camera equipment on her balcony from 4:50 AM onwards.",
                    "notes": "Lifestyle Vlogger. Fake cheerful, obsessed with aesthetics, always recording.",
                    "bloodType": "A+",
                    "dnaSequence": "AGTT-ATTT-TTGT-TAGC",
                    "fingerprintPattern": "LOOP-LOOP-LOOP",
                    "photoUrl": "https://picsum.photos/id/65/400/500",
                },
                {
                    "id": "S4",
                    "name": "Marcus Thorne",
                    "bio": "HOA Vice President. Desperate to take over the Presidency; disagreed with Artie's spending of HOA funds on personal security.. Alibi: Claims he was on his daily 5-mile run, starting at 5:15 AM on the opposite side of the neighborhood.",
                    "notes": "HOA Vice President. Ambitious, bureaucratic, physically fit, speaks like a politician.",
                    "bloodType": "O-",
                    "dnaSequence": "TAAG-GATA-AGGC-TAGA",
                    "fingerprintPattern": "LOOP-LOOP-ARCH",
                    "photoUrl": "https://picsum.photos/id/103/400/500",
                },
                {
                    "id": "S5",
                    "name": "Liam O'Connor",
                    "bio": "Gate Security Guard. Artie had filed three formal complaints trying to get Liam fired for 'improper uniform etiquette'.. Alibi: Claims he was in the gatehouse logging the milk delivery truck.",
                    "notes": "Gate Security Guard. Tired, working class, hates the rich residents, observant.",
                    "bloodType": "O-",
                    "dnaSequence": "CAGT-CCGC-AGGT-GTTG",
                    "fingerprintPattern": "ARCH-LOOP-WHORL",
                    "photoUrl": "https://picsum.photos/id/338/400/500",
                }
            ],
            "entities": [
                {
                    "id": "DOC-001",
                    "type": "PAPER",
                    "label": "Autopsy Report",
                    "content": "Time of death 5:00-5:30 AM. Blunt force trauma. Weapon matches gnome.",
                    "description": "Official medical examiner's report.",
                    "clues": [
                        "Establishes time of death between 5:00 AM and 5:30 AM."
                    ]
                },
                 {
                    "id": "OBJ-002",
                    "type": "OBJECT",
                    "label": "Bloody Garden Gnome",
                    "content": "Heavy cast-iron gnome. Covered in blood and hair. Fingerprint smudged.",
                    "description": "The murder weapon found under a rose bush.",
                    "clues": ["Found 3 yards from body."]
                }
            ],
            "solution": {
                "culpritId": "S2",
                "weaponId": "DOC-001",
                "motive": "Financial ruin and rage over the halted pool construction.",
                "reasoning": "Kenji's alibi relies on his stream. Time-lapse proves he was outside."
            }
        }
    }
];