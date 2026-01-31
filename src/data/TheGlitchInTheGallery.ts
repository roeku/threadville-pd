import { CaseFile, EvidenceType } from "@/types";

export const THE_GLITCH_IN_THE_GALLERY: CaseFile = {
    "title": "The Glitch in the Gallery",
    "caseId": "CASE-1768906690240",
    "status": "published",
    "difficulty": "Hard",
    "briefing": "The Chronos Institute of Modern Art (CIMA) was set to unveil the 'Digital Void', a diamond-encrusted server rack meant to symbolize the cost of data, valued at $12 million. However, the morning of the exhibition, the installation was found dismantled, the diamonds were gone, and the head of night security, Elias Thorne, was found dead in the West Wing corridor. He had been struck by a heavy stylized bust.\n\nThe murder occurred during a chaotic window between 02:00 AM and 02:30 AM when the museum's security system experienced a 'catastrophic handshake failure,' disabling cameras and sensors. Police have secured the perimeter, but the thief—and killer—is likely one of the five people authorized to be in the building during the overnight setup. Detective, your focus is on the timeline and alibis. The killer has tried to use the blackout to their advantage, but every system leaves a trace.",
    "entities": [
        {
            "id": "EVI-001",
            "type": EvidenceType.PHOTO,
            "clues": [
                "The body is oriented away from the gallery, suggesting he was intercepted while running toward the server room."
            ],
            "label": "Crime Scene: West Wing Corridor",
            "content": "A high-resolution, high-angle crime scene photograph captured with flash illumination. The image depicts the victim, identified as Elias Thorne, lying in a prone position on the polished concrete floor of the West Wing Corridor. \n\nKey Visual Elements:\n- The victim is wearing a standard black security uniform with a radio clipped to the belt.\n- The body orientation is significant: the head is pointing directly toward the double doors of the Server Room, while the feet are pointing back toward the Main Gallery archway.\n- There is blunt force trauma visible on the back of the head.\n- To the left of the frame, the edge of a pedestal is visible, currently empty.\n- The corridor appears otherwise undisturbed, save for the body.",
            "imageUrl": "PENDING",
            "metadata": {
                "date": "2023-10-14 03:45:00",
                "notes": "Visual evidence suggests the victim was running towards the server room when intercepted, rather than patrolling the gallery floor.",
                "author": "CSI Photographer Davies",
                "fields": null,
                "location": "West Wing Corridor, Chronos Institute of Modern Art"
            },
            "position": [
                0.053628104596147974,
                0.9,
                0.016475358642722038
            ],
            "rotation": [
                0,
                -0.454573910351162,
                0
            ],
            "description": "High-angle photograph of the victim, Elias Thorne, lying prone in the corridor connecting the main gallery to the server room."
        },
        {
            "id": "EVI-002",
            "type": EvidenceType.PAPER,
            "clues": [
                "Time of death is confirmed between 02:10 AM and 02:25 AM. Cause of death is blunt force trauma to the cranium."
            ],
            "label": "Preliminary Autopsy Report",
            "content": "A formal autopsy report from the City Medical Examiner regarding the death of Elias Thorne. The document outlines the specific injuries sustained and provides a narrow window for the estimated time of death based on body temperature and rigor mortis.",
            "metadata": {
                "location": "Medical Examiner's Office",
                "templateId": "autopsy-report",
                "fields": {
                  "caseNumber": "ME-23-4019",
                  "decedentName": "Elias Thorne",
                  "dateOfDeath": "2023-10-14",
                  "timeOfDeath": "02:10 AM - 02:25 AM",
                  "examinerName": "Dr. S. Kady",
                  "externalFindings": "Severe laceration to occipital region. No defensive wounds on hands or forearms.",
                  "internalFindings": "Depressed skull fracture with subdural hematoma. Cerebral contusions consistent with high-velocity blunt impact.",
                  "causeOfDeath": "Blunt Force Trauma (Cranium)",
                  "mannerOfDeath": "Homicide",
                  "toxicologyNotes": "Blood caffeine levels elevated (12mg/L). No alcohol or narcotics detected."
                }
            },
            "position": [
                0.38923619300201057,
                0.98,
                -0.018720760476551468
            ],
            "rotation": [
                0,
                -0.09535887128560855,
                0
            ],
            "description": "Official medical examiner's report detailing the cause and time of death for Elias Thorne."
        },
        {
            "id": "EVI-003",
            "type": EvidenceType.OBJECT,
            "clues": [
                "Confirmed as the murder weapon. Its weight suggests the attacker needed significant leverage or surprise."
            ],
            "label": "Bronze Neo-Cubist Statuette",
            "content": "Physical Evidence: A heavy, angular bronze bust titled 'The Fractured Man'. \n\nVisual Analysis: The sculpture depicts a human head exploding into geometric shards, typical of the Neo-Cubist style. It is mounted on a dense black marble plinth. \n\nCondition: The object is intact but was found lying on its side. The sharp corner of the marble base is coated in a sticky, drying dark red substance, visually consistent with blood. Several strands of gray hair are adhered to the blood pattern.\n\nDimensions/Weight: Approx. 35cm height, 8.5kg weight. The weight distribution is top-heavy due to the solid bronze casting.",
            "imageUrl": "PENDING",
            "metadata": {
                "date": "Found: October 24, 2024",
                "notes": "Lab analysis confirms this is the murder weapon. The blood matches the victim, Elias Thorne. Given the 8.5kg weight and the angle of impact, the attacker would have needed significant leverage or the element of surprise to deliver a fatal blow to a standing target.",
                "author": "Artist: Julian Verrat (2018)",
                "fields": null,
                "location": "West Wing corridor, Sector 4, adjacent to the victim's feet"
            },
            "position": [
                0.2177217289736448,
                1.06,
                -0.19222446530522397
            ],
            "rotation": [
                0,
                0.8886973373857343,
                0
            ],
            "description": "A heavy, angular bronze bust titled 'The Fractured Man'. Found near the victim's feet with blood on the base."
        },
        {
            "id": "EVI-004",
            "type": EvidenceType.FORENSIC_SAMPLE,
            "clues": [
                "Confirms the statuette was used to kill Elias Thorne."
            ],
            "label": "Blood Swab from Statuette",
            "content": "A sterile evidence tube containing a cotton swab labeled 'Sample A-04'. The swab tip is saturated with a dried, dark crimson fluid collected from the sharp, angular corner of the bronze statuette base ('Time's Weight') found lying near the victim in the West Wing corridor. The collection site on the heavy object corresponds with the shape of the blunt force trauma wound on the victim's skull. Laboratory analysis has processed the sample for biological classification and DNA profiling.",
            "imageUrl": "PENDING",
            "metadata": {
                "forensicType": "DNA"
            },
            "position": [
                -0.197826234512658,
                1.1400000000000001,
                0.24585512029447049
            ],
            "rotation": [
                0,
                0.8880012761694196,
                0
            ],
            "description": "Sample taken from the sharp corner of the bronze statuette base.",
            "forensicData": {
                "type": "DNA",
                "value": "Loci D3S1358: 15,16 | vWA: 17,18 | FGA: 21,22 | D8S1179: 13,13 | Blood Type: O- | Reference Match: Elias Thorne (Probability >99.99%)",
                "description": "Biological material recovered from the impact surface of the bronze statuette. Serology confirms Type O- blood. DNA profile is a perfect match to the victim, Elias Thorne, confirming the statuette was the murder weapon."
            }
        },
        {
            "id": "EVI-005",
            "type": EvidenceType.PAPER,
            "clues": [
                "The log shows continuous typing activity every minute from 01:55 AM to 02:45 AM. However, a system message at 02:15:00 reads 'CRITICAL: HARD RESET INITIATED - DURATION 120s'. Despite the system being down for a reboot, Mira's user account logged a 'git commit' command at 02:16:12. This proves the logs are faked."
            ],
            "label": "Server Activity Logs (Terminal 4)",
            "content": "A dense, continuous printout of command line activity from Terminal 4, assigned to user Mira Solano (M_SOLANO). The logs cover the critical window of the night shift leading up to the theft. The text stream shows a steady rhythm of coding and configuration commands starting at 01:55 AM. However, a glaring contradiction appears at 02:16 AM: a user command is logged with a successful timestamp precisely while the system itself is recording a 'Critical Hard Reset' and total downtime. This physical impossibility suggests the user logs were fabricated or injected in bulk to create a false alibi of work during the blackout.",
            "metadata": {
                "date": "2023-10-24",
                "notes": "The timestamp overlap at 02:16 is technically impossible. The system cannot process a git commit while in the middle of a hard BIOS reset.",
                "author": "System Log Daemon / User M_SOLANO",
                "location": "Server Room B, beneath the main console of Terminal 4",
                "templateId": "server-log",
                "fields": {
                    "source": "Terminal 4 - Active Session History (recovered)",
                    "timestampRange": "01:55:00 AM - 02:45:00 AM",
                    "entries": [ // Corrected to use String array schema
                       "02:10:15 [M_SOLANO] npm install -g void-renderer-v2",
                       "02:12:33 [M_SOLANO] vi /usr/local/cima/config/security_override.sh",
                       "02:14:50 [M_SOLANO] ./deploy_assets --force",
                       "02:15:00 [SYSTEM_ROOT] *** CRITICAL: HARD RESET INITIATED - MANUAL OVERRIDE ***",
                       "02:15:01 [SYSTEM_ROOT] Stopping all services... [OK]. DURATION ESTIMATE: 120s",
                       "02:15:05 [SYSTEM_ROOT] Connection lost. Localhost unreachable.",
                       "02:16:12 [M_SOLANO] git commit -m 'final calibration for Digital Void display'",
                       "02:17:05 [SYSTEM_ROOT] System Boot Sequence Initiated... Kernel loaded.",
                       "02:17:10 [SYSTEM_ROOT] Services restarting... Network [OK].",
                       "02:20:00 [M_SOLANO] ping 192.168.1.50"
                    ]
                }
            },
            "position": [
                0.2940693779483537,
                1.22,
                0.19328081344787673
            ],
            "rotation": [
                0,
                -0.22566508285112385,
                0
            ],
            "description": "A dense, multi-page printout of command line inputs for User ID: M_SOLANO (Mira Solano) covering the night shift."
        },
        {
            "id": "EVI-006",
            "type": EvidenceType.PAPER,
            "clues": [
                "Vane threatens Thorne: 'If you block my installation access one more time, I'll bury you.' (Red Herring: Strong motive for Julian Vane)."
            ],
            "label": "Threatening Email Printout",
            "content": "A crumpled printout of an email exchange found on the corner of the victim's desk. It details a heated dispute regarding security protocols and access rights to the exhibition space shortly before the murder.",
            "metadata": {
                "fields": {
                    "to": "Elias Thorne <e.thorne@cima.org>",
                    "body": "Elias,\n\nI don't care what the 'automated lockdown protocol' dictates. The 'Digital Void' is not just a server rack; it is the centerpiece of this entire institution's fiscal year. I need to calibrate the thermal sensors before the press preview tomorrow morning.\n\nI just tried to badge in and was flagged for 'unauthorized entry.' This is the third time this week.\n\nIf you block my installation access one more time, I'll bury you. I will personally ensure the Board understands exactly who is responsible for delaying a $12 million opening.\n\nOverride the system. Now.\n\n- JV\n\n________________________________\nFrom: Elias Thorne <e.thorne@cima.org>\nSent: October 14, 23:02\nTo: Julian Vane <j.vane@cima.org>\nSubject: ACCESS DENIED - West Wing Server Room\n\nMr. Vane,\n\nPer my previous email, the West Wing is under Class-A lockdown for the diamond transfer. No personnel, including curators, are permitted inside the perimeter until 06:00 tomorrow. My team is securing the area.\n\nExceptions cannot be made.",
                    "date": "October 14, 23:15",
                    "from": "Julian Vane <j.vane@cima.org>",
                    "subject": "RE: ACCESS DENIED - West Wing Server Room"
                },
                "location": "Victim's Desk, West Wing Security Office",
                "templateId": "email-printout"
            },
            "position": [
                0.1817500312833917,
                1.3,
                0.036495165225999326
            ],
            "rotation": [
                0,
                1.2488378034511396,
                0
            ],
            "description": "An email chain between Art Director Julian Vane and Elias Thorne found on the victim's desk."
        },
        {
            "id": "EVI-007",
            "type": EvidenceType.OBJECT,
            "clues": [
                "These tools were used to sever the locking mechanism on the 'Digital Void' rack. They belong to the maintenance kit."
            ],
            "label": "High-Voltage Wire Cutters",
            "content": "A pair of heavy-duty, industrial wire cutters with thick, insulated red rubber handles. The rubber is visibly worn and discolored where the hands would grip, indicating they are an older tool used frequently. The steel cutting jaws show fresh scratches and minor indentations. A small, peeling barcode sticker on the left handle reads 'CIMA-FACILITIES-PROP'.",
            "imageUrl": "PENDING",
            "metadata": {
                "date": "N/A",
                "notes": "Forensic analysis confirms these tools were used to sever the high-tensile locking mechanism on the 'Digital Void' rack. They are part of the standard CIMA maintenance kit stored in this closet.",
                "author": "N/A",
                "fields": null,
                "location": "Utility Closet"
            },
            "position": [
                0.10778959582517703,
                1.38,
                0.04050241853220049
            ],
            "rotation": [
                0,
                0.10874026633053467,
                0
            ],
            "description": "Found in the utility closet. The rubber handles are worn."
        },
        {
            "id": "EVI-008",
            "type": EvidenceType.FORENSIC_SAMPLE,
            "clues": [
                "Points to the maintenance technician, creating a suspect for the theft."
            ],
            "label": "Fingerprints on Wire Cutters",
            "content": "Latent fingerprints recovered from the rubberized grip of the heavy-duty wire cutters found near the dismantled 'Digital Void' installation. The prints were developed using Cyanoacrylate fuming (Superglue method) and subsequently dusted for high contrast. The placement of the friction ridges indicates a firm, operative grip, consistent with the leverage required to sever the server rack's reinforced cabling.",
            "imageUrl": "PENDING",
            "metadata": {
                "forensicType": "FINGERPRINT"
            },
            "position": [
                -0.2690215865018068,
                1.46,
                0.1759921599135177
            ],
            "rotation": [
                0,
                0.4469869996848877,
                0
            ],
            "description": "Latent prints lifted from the handles of the wire cutters.",
            "forensicData": {
                "type": "FINGERPRINT",
                "value": "AFIS-REF: W-772-ACC | RIDGE-COUNT: 14 | MATCH: SUS-003",
                "description": "ANALYSIS REPORT: LAB-TRACE-008\n\n[SPECIMEN DETAILS]\nSource: Tool Handle (Wire Cutters)\nType: Latent Lift\nQuality: High, Grade A\n\n[ANALYSIS]\nPattern Class: Accidental Whorl\nKey Identifiers: Double delta formation with distinct scarring on the right delta.\nMinutiae Points: 16 confirmed matching points.\n\n[COMPARISON RESULT]\nSubject: Maintenance Technician (SUS-003)\nDigit: Right Index Finger\nStatus: POSITIVE MATCH\nConfidence: 99.9%"
            }
        },
        {
            "id": "EVI-009",
            "type": EvidenceType.PHOTO,
            "clues": [
                "The theft required knowledge of the physical mounting hardware, not just the digital locks."
            ],
            "label": "'Digital Void' Installation Damage",
            "content": "A high-resolution forensic photograph focused on the base of the 'Digital Void' art installation. The image captures the damaged mounting points where the server rack was anchored to the exhibition plinth. The reinforced steel brackets have been violently twisted outward and stripped from their housing, exposing the sheared bolts underneath. Deep gouges in the surrounding metal suggest the use of a heavy leverage tool, likely a crowbar or industrial pry bar, applied with significant force. The sockets where the diamonds were embedded are empty, showing rough tool marks around the edges.",
            "imageUrl": "PENDING",
            "metadata": {
                "date": "2023-11-12",
                "notes": "The theft required knowledge of the physical mounting hardware, not just the digital locks. The specific torque pattern on the remaining bolts suggests the perpetrator attempted a clean removal before resorting to force.",
                "author": "Forensic Unit",
                "fields": null,
                "location": "Main Exhibition Hall - Center Plinth"
            },
            "position": [
                -0.280080762447051,
                1.54,
                -0.035932485092683875
            ],
            "rotation": [
                0,
                -0.40718311017971187,
                0
            ],
            "description": "Close-up photo of the diamond-encrusted server rack. The mounting brackets have been violently stripped."
        },
        {
            "id": "EVI-010",
            "type": EvidenceType.PAPER,
            "clues": [
                "Shows Mira owes $45,000 to an offshore gambling site, due immediately. Establishes financial motive."
            ],
            "label": "Past Due Notice",
            "content": "A crumpled letter found in Mira Solano's backpack inside the server room.",
            "metadata": {
                "templateId": "bank-statement",
                "fields": {
                   "bankName": "Cayman Global Virtual",
                   "accountHolder": "Mira Solano",
                   "accountNumber": "****-9122",
                   "statementPeriod": "Oct 01 - Oct 23, 2023",
                   "startingBalance": "$2,400.00",
                   "endingBalance": "-$42,600.00",
                   "transactions": [
                       "2023-10-01 | AWS Services | $140.00 | DEBIT",
                       "2023-10-05 | Salary Deposit | $4500.00 | CREDIT",
                       "2023-10-12 | Lucky7s - Reload | $500.00 | DEBIT",
                       "2023-10-15 | Lucky7s - Reload | $2000.00 | DEBIT",
                       "2023-10-20 | Lucky7s - High Roller Loss Capture | $45000.00 | DEBIT"
                   ]
                }
            },
            "position": [
                -0.08182779900502678,
                1.62,
                0.21568970881303323
            ],
            "rotation": [
                0,
                0.40520131233397144,
                0
            ],
            "description": "A crumpled letter found in Mira Solano's backpack inside the server room."
        },
        {
            "id": "EVI-011",
            "type": EvidenceType.OBJECT,
            "clues": [
                "Contains a Python script designed to mimic human keystrokes at random intervals. Explains how the logs were generated while Mira was away."
            ],
            "label": "USB Drive - 'Script_Auto'",
            "content": "PHYSICAL EVIDENCE:\nOne (1) generic 16GB USB 2.0 flash drive, matte black plastic casing. Found inserted into the rear USB port of the Terminal 4 workstation tower, obscured by network cabling.\n\nDIGITAL FORENSIC ANALYSIS:\nThe drive contains a single executable Python script named 'Script_Auto.py'.\n\nCODE FUNCTIONALITY:\nThe script utilizes the 'pynput' library to automate keyboard input. It runs a loop that:\n1. Waits for a random interval (between 12 and 180 seconds).\n2. Simulates a keypress event (toggling 'Scroll Lock' or pressing 'Shift').\n3. Writes to a local log file: 'keep_alive.log'.\n\nCONCLUSION:\nThis script is designed to mimic human presence, preventing the OS from entering sleep mode or locking the screen due to inactivity. This explains the active user logs on Terminal 4 during the 02:00 AM - 02:30 AM window, contradicting the fact that the operator (Mira) was not physically present at the station during the blackout.",
            "imageUrl": "PENDING",
            "metadata": {
                "date": "2023-10-25",
                "notes": "File creation timestamp is 20:15 on the night of the gala. No usable fingerprints recovered from the device casing.",
                "author": "Forensics Lab",
                "fields": null,
                "location": "Terminal 4, Server Room (Rear I/O Panel)"
            },
            "position": [
                0.22412438721265426,
                1.7000000000000002,
                0.08753369991387577
            ],
            "rotation": [
                0,
                0.4434113816389129,
                0
            ],
            "description": "A small black USB drive found plugged into the back of the Terminal 4 tower."
        },
        {
            "id": "EVI-012",
            "type": EvidenceType.PAPER,
            "clues": [
                "Confirms the 'Catastrophic Handshake Failure' was triggered manually from the Server Room at 02:00 AM."
            ],
            "label": "Security System Diagnostics",
            "content": "A printed diagnostic report from the CIMA security server. The text indicates that the system failure was not an accident.",
            "metadata": {
                "templateId": "incident-report",
                "fields": {
                    "badge": "SYS-ROOT",
                    "header": "SECURITY SYSTEM DIAGNOSTIC REPORT",
                    "officer": "Automated Watchdog V.4.2",
                    "datetime": "October 24, 02:00:03 AM",
                    "location": "Server Room (Physical Terminal)",
                    "subtitle": "Chronos Institute of Modern Art - Automated Log",
                    "narrative": "CRITICAL ERROR: CATASTROPHIC HANDSHAKE FAILURE\n\nEVENT LOG ANALYSIS:\nAt 02:00:03 AM, the central security grid experienced a total blackout. All cameras, motion sensors, and magnetic locks were disengaged simultaneously.\n\nROOT CAUSE:\nDiagnostic traces confirm this was NOT a network timeout or external cyber-attack. The shutdown command was executed locally.\n\nFINDINGS:\n- Origin: Server Room Main Console\n- Method: Physical Keyboard Input\n- Timestamp: 02:00 AM\n\nThe 'Catastrophic Handshake Failure' was triggered manually from the Server Room using high-level administrative clearance.",
                    "supervisor": "IT Department Head",
                    "incidentType": "Critical System Failure / Manual Override",
                    "reportNumber": "SYS-LOG-2023-10-24-ERR"
                },
                "location": "Server Room Control Desk, under a stack of manuals",
                
            },
            "position": [
                0.013428549743225916,
                1.78,
                0.05440257389933795
            ],
            "rotation": [
                0,
                0.14769530172323753,
                0
            ],
            "description": "Automated report generated after power was restored."
        },
        {
            "id": "EVI-013",
            "type": EvidenceType.FORENSIC_SAMPLE,
            "clues": [
                "DNA evidence placing a suspect in close contact with the victim. (Red Herring pointing to the Art Director who has long hair)."
            ],
            "label": "Hair Follicle on Victim's Jacket",
            "content": "A single strand of dark human hair, approximately 18cm in length, recovered from the left shoulder epaulet of Elias Thorne's security uniform. The follicle root is intact, allowing for nuclear DNA extraction. The position suggests it fell or was transferred during close physical proximity, possibly a struggle or collision.",
            "imageUrl": "PENDING",
            "metadata": {
                "forensicType": "DNA"
            },
            "position": [
                0.17889792283088335,
                1.8599999999999999,
                0.015181523503648209
            ],
            "rotation": [
                0,
                -0.4341954400126366,
                0
            ],
            "description": "A single long hair found on the shoulder of Elias Thorne's uniform.",
            "forensicData": {
                "type": "DNA",
                "value": "Loci D3S1358: 15,16 | vWA: 17,19 | FGA: 20,22 | D8S1179: 13,13 | D21S11: 29,30 | AMEL: X,Y",
                "description": "Analysis of the follicular tag yields a full STR profile matching reference sample REF-004 (Julian Vane, Art Director). The presence of the root suggests the hair was not merely shed but likely pulled or dislodged during contact."
            }
        }
    ],
    "solution": {
        "motive": "To silence Elias after he caught her disabling the security grid to allow the theft of the diamonds.",
        "weaponId": "EVI-003",
        "culpritId": "SUS-002",
        "reasoning": "Mira Solano's alibi relies entirely on the server logs showing continuous typing activity under her User ID between 01:55 AM and 02:45 AM. However, the timeline indicates a 'Hard Reset' of the main server at 02:15 AM which lasted for 120 seconds. It is impossible for a human to generate server logs on a machine that is powered down and rebooting. This proves the logs were pre-scripted or falsified to cover her absence while she was in the West Wing murdering Elias."
    },
    "suspects": [
        {
            "id": "SUS-001",
            "bio": "Museum Curator. Deep in gambling debt; Elias (his brother) refused to lend him money and threatened to expose Aris's embezzlement.. Alibi: Claims he was in his soundproof office on the 4th floor reviewing catalog proofs. States he didn't hear the commotion.",
            "name": "Dr. Aris Thorne",
            "notes": "Museum Curator",
            "bloodType": "O+",
            "dnaSequence": "AGCT-TCGA-CGTA-ATGC",
            "fingerprintPattern": "LOOP-ARCH-LOOP"
        },
        {
            "id": "SUS-002",
            "bio": "Lead Systems Engineer. Blackmailed by an external syndicate to facilitate the theft; Elias caught her looping the footage.. Alibi: Claims she was in the locked Server Room typing code to fix the glitch from 01:55 AM until 02:45 AM. Logs show continuous user activity under her ID.",
            "name": "Mira Solano",
            "notes": "Lead Systems Engineer",
            "bloodType": "O+",
            "dnaSequence": "TGCA-GCAT-TAGC-CGTA",
            "fingerprintPattern": "WHORL-WHORL-ARCH"
        },
        {
            "id": "SUS-003",
            "bio": "Installation Artist. Believed the museum was 'killing' his art; has a history of violent outbursts. Hated Elias for enforcing strict rules.. Alibi: Was in the loading bay smoking and live-streaming a rant to his private discord server. Timestamped video exists.",
            "name": "Kaelen Voss",
            "notes": "Installation Artist",
            "bloodType": "O+",
            "dnaSequence": "CATG-ATCG-GCTA-GCGC",
            "fingerprintPattern": "WHORL-ACCIDENTAL-LOOP"
        },
        {
            "id": "SUS-004",
            "bio": "Art Restorer. Elias discovered she had been swapping authentic minor pieces for replicas.. Alibi: Was in the chemically sealed restoration lab. Keycard logs show entry at 01:00 AM and no exit until 03:00 AM.",
            "name": "Priya Desai",
            "notes": "Art Restorer",
            "bloodType": "O+",
            "dnaSequence": "GTAC-CGTA-ATGC-TAGC",
            "fingerprintPattern": "LOOP-LOOP-LOOP"
        },
        {
            "id": "SUS-005",
            "bio": "Junior Security Guard. Next in line for Elias's job; allegedly resented Elias for blocking his promotion.. Alibi: Patrolling the exterior perimeter. GPS tracker on his belt shows him walking the grounds during the blackout.",
            "name": "Tariq Jameel",
            "notes": "Junior Security Guard",
            "bloodType": "O+",
            "dnaSequence": "TAGC-AGCT-TCGA-CGTA",
            "fingerprintPattern": "ARCH-ARCH-WHORL"
        }
    ]
};
