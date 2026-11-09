---
title: DID 从入门到精通（11）：前沿与实战——预检验的局限、HonestDiD、双重稳健 DID 与完整研究清单
date: 2026-10-08 10:00:00
categories: Econometrics
tags: [DID, DID高级]
summary: 系列终篇。讨论平行趋势预检验的功效问题、HonestDiD 敏感性分析、条件平行趋势与双重稳健 DID，简要介绍连续处理 DID 与合成 DID，最后给出一份从研究设计到结果报告的完整 DID 实证清单。
---
经过前面十篇，我们已经掌握了 DID 的识别逻辑、回归实现、事件研究、稳健性检验、统计推断，以及交错 DID 的新方法。这一篇讨论几个更前沿、但在实际研究中越来越常被问到的问题，最后把整个系列浓缩成一份可操作的研究清单。

<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true"><defs><path id="MJX-TEX-I-1D458" d="M121 647Q121 657 125 670T137 683Q138 683 209 688T282 694Q294 694 294 686Q294 679 244 477Q194 279 194 272Q213 282 223 291Q247 309 292 354T362 415Q402 442 438 442Q468 442 485 423T503 369Q503 344 496 327T477 302T456 291T438 288Q418 288 406 299T394 328Q394 353 410 369T442 390L458 393Q446 405 434 405H430Q398 402 367 380T294 316T228 255Q230 254 243 252T267 246T293 238T320 224T342 206T359 180T365 147Q365 130 360 106T354 66Q354 26 381 26Q429 26 459 145Q461 153 479 153H483Q499 153 499 144Q499 139 496 130Q455 -11 378 -11Q333 -11 305 15T277 90Q277 108 280 121T283 145Q283 167 269 183T234 206T200 217T182 220H180Q168 178 159 139T145 81T136 44T129 20T122 7T111 -2Q98 -11 83 -11Q66 -11 57 -1T48 16Q48 26 85 176T158 471L195 616Q196 629 188 632T149 637H144Q134 637 131 637T124 640T121 647Z"></path><path id="MJX-TEX-N-3D" d="M56 347Q56 360 70 367H707Q722 359 722 347Q722 336 708 328L390 327H72Q56 332 56 347ZM56 153Q56 168 72 173H708Q722 163 722 153Q722 140 707 133H70Q56 140 56 153Z"></path><path id="MJX-TEX-N-2212" d="M84 237T84 250T98 270H679Q694 262 694 250T679 230H98Q84 237 84 250Z"></path><path id="MJX-TEX-N-31" d="M213 578L200 573Q186 568 160 563T102 556H83V602H102Q149 604 189 617T245 641T273 663Q275 666 285 666Q294 666 302 660V361L303 61Q310 54 315 52T339 48T401 46H427V0H416Q395 3 257 3Q121 3 100 0H88V46H114Q136 46 152 46T177 47T193 50T201 52T207 57T213 61V578Z"></path><path id="MJX-TEX-N-30" d="M96 585Q152 666 249 666Q297 666 345 640T423 548Q460 465 460 320Q460 165 417 83Q397 41 362 16T301 -15T250 -22Q224 -22 198 -16T137 16T82 83Q39 165 39 320Q39 494 96 585ZM321 597Q291 629 250 629Q208 629 178 597Q153 571 145 525T137 333Q137 175 145 125T181 46Q209 16 250 16Q290 16 318 46Q347 76 354 130T362 333Q362 478 354 524T321 597Z"></path><path id="MJX-TEX-N-2E" d="M78 60Q78 84 95 102T138 120Q162 120 180 104T199 61Q199 36 182 18T139 0T96 17T78 60Z"></path><path id="MJX-TEX-N-D7" d="M630 29Q630 9 609 9Q604 9 587 25T493 118L389 222L284 117Q178 13 175 11Q171 9 168 9Q160 9 154 15T147 29Q147 36 161 51T255 146L359 250L255 354Q174 435 161 449T147 471Q147 480 153 485T168 490Q173 490 175 489Q178 487 284 383L389 278L493 382Q570 459 587 475T609 491Q630 491 630 471Q630 464 620 453T522 355L418 250L522 145Q606 61 618 48T630 29Z"></path><path id="MJX-TEX-N-28" d="M94 250Q94 319 104 381T127 488T164 576T202 643T244 695T277 729T302 750H315H319Q333 750 333 741Q333 738 316 720T275 667T226 581T184 443T167 250T184 58T225 -81T274 -167T316 -220T333 -241Q333 -250 318 -250H315H302L274 -226Q180 -141 137 -14T94 250Z"></path><path id="MJX-TEX-N-2B" d="M56 237T56 250T70 270H369V420L370 570Q380 583 389 583Q402 583 409 568V270H707Q722 262 722 250T707 230H409V-68Q401 -82 391 -82H389H387Q375 -82 369 -68V230H70Q56 237 56 250Z"></path><path id="MJX-TEX-N-32" d="M109 429Q82 429 66 447T50 491Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z"></path><path id="MJX-TEX-N-33" d="M127 463Q100 463 85 480T69 524Q69 579 117 622T233 665Q268 665 277 664Q351 652 390 611T430 522Q430 470 396 421T302 350L299 348Q299 347 308 345T337 336T375 315Q457 262 457 175Q457 96 395 37T238 -22Q158 -22 100 21T42 130Q42 158 60 175T105 193Q133 193 151 175T169 130Q169 119 166 110T159 94T148 82T136 74T126 70T118 67L114 66Q165 21 238 21Q293 21 321 74Q338 107 338 175V195Q338 290 274 322Q259 328 213 329L171 330L168 332Q166 335 166 348Q166 366 174 366Q202 366 232 371Q266 376 294 413T322 525V533Q322 590 287 612Q265 626 240 626Q208 626 181 615T143 592T132 580H135Q138 579 143 578T153 573T165 566T175 555T183 540T186 520Q186 498 172 481T127 463Z"></path><path id="MJX-TEX-N-34" d="M462 0Q444 3 333 3Q217 3 199 0H190V46H221Q241 46 248 46T265 48T279 53T286 61Q287 63 287 115V165H28V211L179 442Q332 674 334 675Q336 677 355 677H373L379 671V211H471V165H379V114Q379 73 379 66T385 54Q393 47 442 46H471V0H462ZM293 211V545L74 212L183 211H293Z"></path><path id="MJX-TEX-N-35" d="M164 157Q164 133 148 117T109 101H102Q148 22 224 22Q294 22 326 82Q345 115 345 210Q345 313 318 349Q292 382 260 382H254Q176 382 136 314Q132 307 129 306T114 304Q97 304 95 310Q93 314 93 485V614Q93 664 98 664Q100 666 102 666Q103 666 123 658T178 642T253 634Q324 634 389 662Q397 666 402 666Q410 666 410 648V635Q328 538 205 538Q174 538 149 544L139 546V374Q158 388 169 396T205 412T256 420Q337 420 393 355T449 201Q449 109 385 44T229 -22Q148 -22 99 32T50 154Q50 178 61 192T84 210T107 214Q132 214 148 197T164 157Z"></path><path id="MJX-TEX-N-29" d="M60 749L64 750Q69 750 74 750H86L114 726Q208 641 251 514T294 250Q294 182 284 119T261 12T224 -76T186 -143T145 -194T113 -227T90 -246Q87 -249 86 -250H74Q66 -250 63 -250T58 -247T55 -238Q56 -237 66 -225Q221 -64 221 250T66 725Q56 737 55 738Q55 746 60 749Z"></path><path id="MJX-TEX-N-2F" d="M423 750Q432 750 438 744T444 730Q444 725 271 248T92 -240Q85 -250 75 -250Q68 -250 62 -245T56 -231Q56 -221 230 257T407 740Q411 750 423 750Z"></path><path id="MJX-TEX-I-1D6FD" d="M29 -194Q23 -188 23 -186Q23 -183 102 134T186 465Q208 533 243 584T309 658Q365 705 429 705H431Q493 705 533 667T573 570Q573 465 469 396L482 383Q533 332 533 252Q533 139 448 65T257 -10Q227 -10 203 -2T165 17T143 40T131 59T126 65L62 -188Q60 -194 42 -194H29ZM353 431Q392 431 427 419L432 422Q436 426 439 429T449 439T461 453T472 471T484 495T493 524T501 560Q503 569 503 593Q503 611 502 616Q487 667 426 667Q384 667 347 643T286 582T247 514T224 455Q219 439 186 308T152 168Q151 163 151 147Q151 99 173 68Q204 26 260 26Q302 26 349 51T425 137Q441 171 449 214T457 279Q457 337 422 372Q380 358 347 358H337Q258 358 258 389Q258 396 261 403Q275 431 353 431Z"></path><path id="MJX-TEX-I-1D461" d="M26 385Q19 392 19 395Q19 399 22 411T27 425Q29 430 36 430T87 431H140L159 511Q162 522 166 540T173 566T179 586T187 603T197 615T211 624T229 626Q247 625 254 615T261 596Q261 589 252 549T232 470L222 433Q222 431 272 431H323Q330 424 330 420Q330 398 317 385H210L174 240Q135 80 135 68Q135 26 162 26Q197 26 230 60T283 144Q285 150 288 151T303 153H307Q322 153 322 145Q322 142 319 133Q314 117 301 95T267 48T216 6T155 -11Q125 -11 98 4T59 56Q57 64 57 83V101L92 241Q127 382 128 383Q128 385 77 385H26Z"></path><path id="MJX-TEX-I-1D70F" d="M39 284Q18 284 18 294Q18 301 45 338T99 398Q134 425 164 429Q170 431 332 431Q492 431 497 429Q517 424 517 402Q517 388 508 376T485 360Q479 358 389 358T299 356Q298 355 283 274T251 109T233 20Q228 5 215 -4T186 -13Q153 -13 153 20V30L203 192Q214 228 227 272T248 336L254 357Q254 358 208 358Q206 358 197 358T183 359Q105 359 61 295Q56 287 53 286T39 284Z"></path><path id="MJX-TEX-I-1D6FF" d="M195 609Q195 656 227 686T302 717Q319 716 351 709T407 697T433 690Q451 682 451 662Q451 644 438 628T403 612Q382 612 348 641T288 671T249 657T235 628Q235 584 334 463Q401 379 401 292Q401 169 340 80T205 -10H198Q127 -10 83 36T36 153Q36 286 151 382Q191 413 252 434Q252 435 245 449T230 481T214 521T201 566T195 609ZM112 130Q112 83 136 55T204 27Q233 27 256 51T291 111T309 178T316 232Q316 267 309 298T295 344T269 400L259 396Q215 381 183 342T137 256T118 179T112 130Z"></path><path id="MJX-TEX-N-7C" d="M139 -249H137Q125 -249 119 -235V251L120 737Q130 750 139 750Q152 750 159 735V-235Q151 -249 141 -249H139Z"></path><path id="MJX-TEX-N-2264" d="M674 636Q682 636 688 630T694 615T687 601Q686 600 417 472L151 346L399 228Q687 92 691 87Q694 81 694 76Q694 58 676 56H670L382 192Q92 329 90 331Q83 336 83 348Q84 359 96 365Q104 369 382 500T665 634Q669 636 674 636ZM84 -118Q84 -108 99 -98H678Q694 -104 694 -118Q694 -130 679 -138H98Q84 -131 84 -118Z"></path><path id="MJX-TEX-I-1D440" d="M289 629Q289 635 232 637Q208 637 201 638T194 648Q194 649 196 659Q197 662 198 666T199 671T201 676T203 679T207 681T212 683T220 683T232 684Q238 684 262 684T307 683Q386 683 398 683T414 678Q415 674 451 396L487 117L510 154Q534 190 574 254T662 394Q837 673 839 675Q840 676 842 678T846 681L852 683H948Q965 683 988 683T1017 684Q1051 684 1051 673Q1051 668 1048 656T1045 643Q1041 637 1008 637Q968 636 957 634T939 623Q936 618 867 340T797 59Q797 55 798 54T805 50T822 48T855 46H886Q892 37 892 35Q892 19 885 5Q880 0 869 0Q864 0 828 1T736 2Q675 2 644 2T609 1Q592 1 592 11Q592 13 594 25Q598 41 602 43T625 46Q652 46 685 49Q699 52 704 61Q706 65 742 207T813 490T848 631L654 322Q458 10 453 5Q451 4 449 3Q444 0 433 0Q418 0 415 7Q413 11 374 317L335 624L267 354Q200 88 200 79Q206 46 272 46H282Q288 41 289 37T286 19Q282 3 278 1Q274 0 267 0Q265 0 255 0T221 1T157 2Q127 2 95 1T58 0Q43 0 39 2T35 11Q35 13 38 25T43 40Q45 46 65 46Q135 46 154 86Q158 92 223 354T289 629Z"></path><path id="MJX-TEX-N-AF" d="M69 544V590H430V544H69Z"></path><path id="MJX-TEX-N-22C5" d="M78 250Q78 274 95 292T138 310Q162 310 180 294T199 251Q199 226 182 208T139 190T96 207T78 250Z"></path><path id="MJX-TEX-N-6D" d="M41 46H55Q94 46 102 60V68Q102 77 102 91T102 122T103 161T103 203Q103 234 103 269T102 328V351Q99 370 88 376T43 385H25V408Q25 431 27 431L37 432Q47 433 65 434T102 436Q119 437 138 438T167 441T178 442H181V402Q181 364 182 364T187 369T199 384T218 402T247 421T285 437Q305 442 336 442Q351 442 364 440T387 434T406 426T421 417T432 406T441 395T448 384T452 374T455 366L457 361L460 365Q463 369 466 373T475 384T488 397T503 410T523 422T546 432T572 439T603 442Q729 442 740 329Q741 322 741 190V104Q741 66 743 59T754 49Q775 46 803 46H819V0H811L788 1Q764 2 737 2T699 3Q596 3 587 0H579V46H595Q656 46 656 62Q657 64 657 200Q656 335 655 343Q649 371 635 385T611 402T585 404Q540 404 506 370Q479 343 472 315T464 232V168V108Q464 78 465 68T468 55T477 49Q498 46 526 46H542V0H534L510 1Q487 2 460 2T422 3Q319 3 310 0H302V46H318Q379 46 379 62Q380 64 380 200Q379 335 378 343Q372 371 358 385T334 402T308 404Q263 404 229 370Q202 343 195 315T187 232V168V108Q187 78 188 68T191 55T200 49Q221 46 249 46H265V0H257L234 1Q210 2 183 2T145 3Q42 3 33 0H25V46H41Z"></path><path id="MJX-TEX-N-61" d="M137 305T115 305T78 320T63 359Q63 394 97 421T218 448Q291 448 336 416T396 340Q401 326 401 309T402 194V124Q402 76 407 58T428 40Q443 40 448 56T453 109V145H493V106Q492 66 490 59Q481 29 455 12T400 -6T353 12T329 54V58L327 55Q325 52 322 49T314 40T302 29T287 17T269 6T247 -2T221 -8T190 -11Q130 -11 82 20T34 107Q34 128 41 147T68 188T116 225T194 253T304 268H318V290Q318 324 312 340Q290 411 215 411Q197 411 181 410T156 406T148 403Q170 388 170 359Q170 334 154 320ZM126 106Q126 75 150 51T209 26Q247 26 276 49T315 109Q317 116 318 175Q318 233 317 233Q309 233 296 232T251 223T193 203T147 166T126 106Z"></path><path id="MJX-TEX-N-78" d="M201 0Q189 3 102 3Q26 3 17 0H11V46H25Q48 47 67 52T96 61T121 78T139 96T160 122T180 150L226 210L168 288Q159 301 149 315T133 336T122 351T113 363T107 370T100 376T94 379T88 381T80 383Q74 383 44 385H16V431H23Q59 429 126 429Q219 429 229 431H237V385Q201 381 201 369Q201 367 211 353T239 315T268 274L272 270L297 304Q329 345 329 358Q329 364 327 369T322 376T317 380T310 384L307 385H302V431H309Q324 428 408 428Q487 428 493 431H499V385H492Q443 385 411 368Q394 360 377 341T312 257L296 236L358 151Q424 61 429 57T446 50Q464 46 499 46H516V0H510H502Q494 1 482 1T457 2T432 2T414 3Q403 3 377 3T327 1L304 0H295V46H298Q309 46 320 51T331 63Q331 65 291 120L250 175Q249 174 219 133T185 88Q181 83 181 74Q181 63 188 55T206 46Q208 46 208 23V0H201Z"></path><path id="MJX-TEX-I-1D460" d="M131 289Q131 321 147 354T203 415T300 442Q362 442 390 415T419 355Q419 323 402 308T364 292Q351 292 340 300T328 326Q328 342 337 354T354 372T367 378Q368 378 368 379Q368 382 361 388T336 399T297 405Q249 405 227 379T204 326Q204 301 223 291T278 274T330 259Q396 230 396 163Q396 135 385 107T352 51T289 7T195 -10Q118 -10 86 19T53 87Q53 126 74 143T118 160Q133 160 146 151T160 120Q160 94 142 76T111 58Q109 57 108 57T107 55Q108 52 115 47T146 34T201 27Q237 27 263 38T301 66T318 97T323 122Q323 150 302 164T254 181T195 196T148 231Q131 256 131 289Z"></path><path id="MJX-TEX-N-3C" d="M694 -11T694 -19T688 -33T678 -40Q671 -40 524 29T234 166L90 235Q83 240 83 250Q83 261 91 266Q664 540 678 540Q681 540 687 534T694 519T687 505Q686 504 417 376L151 250L417 124Q686 -4 687 -5Q694 -11 694 -19Z"></path><path id="MJX-TEX-N-3E" d="M84 520Q84 528 88 533T96 539L99 540Q106 540 253 471T544 334L687 265Q694 260 694 250T687 235Q685 233 395 96L107 -40H101Q83 -38 83 -20Q83 -19 83 -17Q82 -10 98 -1Q117 9 248 71Q326 108 378 132L626 250L378 368Q90 504 86 509Q84 513 84 520Z"></path><path id="MJX-TEX-I-1D438" d="M492 213Q472 213 472 226Q472 230 477 250T482 285Q482 316 461 323T364 330H312Q311 328 277 192T243 52Q243 48 254 48T334 46Q428 46 458 48T518 61Q567 77 599 117T670 248Q680 270 683 272Q690 274 698 274Q718 274 718 261Q613 7 608 2Q605 0 322 0H133Q31 0 31 11Q31 13 34 25Q38 41 42 43T65 46Q92 46 125 49Q139 52 144 61Q146 66 215 342T285 622Q285 629 281 629Q273 632 228 634H197Q191 640 191 642T193 659Q197 676 203 680H757Q764 676 764 669Q764 664 751 557T737 447Q735 440 717 440H705Q698 445 698 453L701 476Q704 500 704 528Q704 558 697 578T678 609T643 625T596 632T532 634H485Q397 633 392 631Q388 629 386 622Q385 619 355 499T324 377Q347 376 372 376H398Q464 376 489 391T534 472Q538 488 540 490T557 493Q562 493 565 493T570 492T572 491T574 487T577 483L544 351Q511 218 508 216Q505 213 492 213Z"></path><path id="MJX-TEX-N-5B" d="M118 -250V750H255V710H158V-210H255V-250H118Z"></path><path id="MJX-TEX-I-1D44C" d="M66 637Q54 637 49 637T39 638T32 641T30 647T33 664T42 682Q44 683 56 683Q104 680 165 680Q288 680 306 683H316Q322 677 322 674T320 656Q316 643 310 637H298Q242 637 242 624Q242 619 292 477T343 333L346 336Q350 340 358 349T379 373T411 410T454 461Q546 568 561 587T577 618Q577 634 545 637Q528 637 528 647Q528 649 530 661Q533 676 535 679T549 683Q551 683 578 682T657 680Q684 680 713 681T746 682Q763 682 763 673Q763 669 760 657T755 643Q753 637 734 637Q662 632 617 587Q608 578 477 424L348 273L322 169Q295 62 295 57Q295 46 363 46Q379 46 384 45T390 35Q390 33 388 23Q384 6 382 4T366 1Q361 1 324 1T232 2Q170 2 138 2T102 1Q84 1 84 9Q84 14 87 24Q88 27 89 30T90 35T91 39T93 42T96 44T101 45T107 45T116 46T129 46Q168 47 180 50T198 63Q201 68 227 171L252 274L129 623Q128 624 127 625T125 627T122 629T118 631T113 633T105 634T96 635T83 636T66 637Z"></path><path id="MJX-TEX-N-2223" d="M139 -249H137Q125 -249 119 -235V251L120 737Q130 750 139 750Q152 750 159 735V-235Q151 -249 141 -249H139Z"></path><path id="MJX-TEX-I-1D437" d="M287 628Q287 635 230 637Q207 637 200 638T193 647Q193 655 197 667T204 682Q206 683 403 683Q570 682 590 682T630 676Q702 659 752 597T803 431Q803 275 696 151T444 3L430 1L236 0H125H72Q48 0 41 2T33 11Q33 13 36 25Q40 41 44 43T67 46Q94 46 127 49Q141 52 146 61Q149 65 218 339T287 628ZM703 469Q703 507 692 537T666 584T629 613T590 629T555 636Q553 636 541 636T512 636T479 637H436Q392 637 386 627Q384 623 313 339T242 52Q242 48 253 48T330 47Q335 47 349 47T373 46Q499 46 581 128Q617 164 640 212T683 339T703 469Z"></path><path id="MJX-TEX-N-2C" d="M78 35T78 60T94 103T137 121Q165 121 187 96T210 8Q210 -27 201 -60T180 -117T154 -158T130 -185T117 -194Q113 -194 104 -185T95 -172Q95 -168 106 -156T131 -126T157 -76T173 -3V9L172 8Q170 7 167 6T161 3T152 1T140 0Q113 0 96 17Z"></path><path id="MJX-TEX-I-1D44B" d="M42 0H40Q26 0 26 11Q26 15 29 27Q33 41 36 43T55 46Q141 49 190 98Q200 108 306 224T411 342Q302 620 297 625Q288 636 234 637H206Q200 643 200 645T202 664Q206 677 212 683H226Q260 681 347 681Q380 681 408 681T453 682T473 682Q490 682 490 671Q490 670 488 658Q484 643 481 640T465 637Q434 634 411 620L488 426L541 485Q646 598 646 610Q646 628 622 635Q617 635 609 637Q594 637 594 648Q594 650 596 664Q600 677 606 683H618Q619 683 643 683T697 681T738 680Q828 680 837 683H845Q852 676 852 672Q850 647 840 637H824Q790 636 763 628T722 611T698 593L687 584Q687 585 592 480L505 384Q505 383 536 304T601 142T638 56Q648 47 699 46Q734 46 734 37Q734 35 732 23Q728 7 725 4T711 1Q708 1 678 1T589 2Q528 2 496 2T461 1Q444 1 444 10Q444 11 446 25Q448 35 450 39T455 44T464 46T480 47T506 54Q523 62 523 64Q522 64 476 181L429 299Q241 95 236 84Q232 76 232 72Q232 53 261 47Q262 47 267 47T273 46Q276 46 277 46T280 45T283 42T284 35Q284 26 282 19Q279 6 276 4T261 1Q258 1 243 1T201 2T142 2Q64 2 42 0Z"></path><path id="MJX-TEX-N-5D" d="M22 710V750H159V-250H22V-210H119V710H22Z"></path><path id="MJX-TEX-N-394" d="M51 0Q46 4 46 7Q46 9 215 357T388 709Q391 716 416 716Q439 716 444 709Q447 705 616 357T786 7Q786 4 781 0H51ZM507 344L384 596L137 92L383 91H630Q630 93 507 344Z"></path><path id="MJX-TEX-N-49" d="M328 0Q307 3 180 3T32 0H21V46H43Q92 46 106 49T126 60Q128 63 128 342Q128 620 126 623Q122 628 118 630T96 635T43 637H21V683H32Q53 680 180 680T328 683H339V637H317Q268 637 254 634T234 623Q232 620 232 342Q232 63 234 60Q238 55 242 53T264 48T317 46H339V0H328Z"></path><path id="MJX-TEX-N-6E" d="M41 46H55Q94 46 102 60V68Q102 77 102 91T102 122T103 161T103 203Q103 234 103 269T102 328V351Q99 370 88 376T43 385H25V408Q25 431 27 431L37 432Q47 433 65 434T102 436Q119 437 138 438T167 441T178 442H181V402Q181 364 182 364T187 369T199 384T218 402T247 421T285 437Q305 442 336 442Q450 438 463 329Q464 322 464 190V104Q464 66 466 59T477 49Q498 46 526 46H542V0H534L510 1Q487 2 460 2T422 3Q319 3 310 0H302V46H318Q379 46 379 62Q380 64 380 200Q379 335 378 343Q372 371 358 385T334 402T308 404Q263 404 229 370Q202 343 195 315T187 232V168V108Q187 78 188 68T191 55T200 49Q221 46 249 46H265V0H257L234 1Q210 2 183 2T145 3Q42 3 33 0H25V46H41Z"></path><path id="MJX-TEX-N-74" d="M27 422Q80 426 109 478T141 600V615H181V431H316V385H181V241Q182 116 182 100T189 68Q203 29 238 29Q282 29 292 100Q293 108 293 146V181H333V146V134Q333 57 291 17Q264 -10 221 -10Q187 -10 162 2T124 33T105 68T98 100Q97 107 97 248V385H18V422H27Z"></path><path id="MJX-TEX-N-65" d="M28 218Q28 273 48 318T98 391T163 433T229 448Q282 448 320 430T378 380T406 316T415 245Q415 238 408 231H126V216Q126 68 226 36Q246 30 270 30Q312 30 342 62Q359 79 369 104L379 128Q382 131 395 131H398Q415 131 415 121Q415 117 412 108Q393 53 349 21T250 -11Q155 -11 92 58T28 218ZM333 275Q322 403 238 411H236Q228 411 220 410T195 402T166 381T143 340T127 274V267H333V275Z"></path><path id="MJX-TEX-N-73" d="M295 316Q295 356 268 385T190 414Q154 414 128 401Q98 382 98 349Q97 344 98 336T114 312T157 287Q175 282 201 278T245 269T277 256Q294 248 310 236T342 195T359 133Q359 71 321 31T198 -10H190Q138 -10 94 26L86 19L77 10Q71 4 65 -1L54 -11H46H42Q39 -11 33 -5V74V132Q33 153 35 157T45 162H54Q66 162 70 158T75 146T82 119T101 77Q136 26 198 26Q295 26 295 104Q295 133 277 151Q257 175 194 187T111 210Q75 227 54 256T33 318Q33 357 50 384T93 424T143 442T187 447H198Q238 447 268 432L283 424L292 431Q302 440 314 448H322H326Q329 448 335 442V310L329 304H301Q295 310 295 316Z"></path><path id="MJX-TEX-N-69" d="M69 609Q69 637 87 653T131 669Q154 667 171 652T188 609Q188 579 171 564T129 549Q104 549 87 564T69 609ZM247 0Q232 3 143 3Q132 3 106 3T56 1L34 0H26V46H42Q70 46 91 49Q100 53 102 60T104 102V205V293Q104 345 102 359T88 378Q74 385 41 385H30V408Q30 431 32 431L42 432Q52 433 70 434T106 436Q123 437 142 438T171 441T182 442H185V62Q190 52 197 50T232 46H255V0H247Z"></path><path id="MJX-TEX-N-79" d="M69 -66Q91 -66 104 -80T118 -116Q118 -134 109 -145T91 -160Q84 -163 97 -166Q104 -168 111 -168Q131 -168 148 -159T175 -138T197 -106T213 -75T225 -43L242 0L170 183Q150 233 125 297Q101 358 96 368T80 381Q79 382 78 382Q66 385 34 385H19V431H26L46 430Q65 430 88 429T122 428Q129 428 142 428T171 429T200 430T224 430L233 431H241V385H232Q183 385 185 366L286 112Q286 113 332 227L376 341V350Q376 365 366 373T348 383T334 385H331V431H337H344Q351 431 361 431T382 430T405 429T422 429Q477 429 503 431H508V385H497Q441 380 422 345Q420 343 378 235T289 9T227 -131Q180 -204 113 -204Q69 -204 44 -177T19 -116Q19 -89 35 -78T69 -66Z"></path><path id="MJX-TEX-I-1D456" d="M184 600Q184 624 203 642T247 661Q265 661 277 649T290 619Q290 596 270 577T226 557Q211 557 198 567T184 600ZM21 287Q21 295 30 318T54 369T98 420T158 442Q197 442 223 419T250 357Q250 340 236 301T196 196T154 83Q149 61 149 51Q149 26 166 26Q175 26 185 29T208 43T235 78T260 137Q263 149 265 151T282 153Q302 153 302 143Q302 135 293 112T268 61T223 11T161 -11Q129 -11 102 10T74 74Q74 91 79 106T122 220Q160 321 166 341T173 380Q173 404 156 404H154Q124 404 99 371T61 287Q60 286 59 284T58 281T56 279T53 278T49 278T41 278H27Q21 284 21 287Z"></path><path id="MJX-TEX-N-50" d="M130 622Q123 629 119 631T103 634T60 637H27V683H214Q237 683 276 683T331 684Q419 684 471 671T567 616Q624 563 624 489Q624 421 573 372T451 307Q429 302 328 301H234V181Q234 62 237 58Q245 47 304 46H337V0H326Q305 3 182 3Q47 3 38 0H27V46H60Q102 47 111 49T130 61V622ZM507 488Q507 514 506 528T500 564T483 597T450 620T397 635Q385 637 307 637H286Q237 637 234 628Q231 624 231 483V342H302H339Q390 342 423 349T481 382Q507 411 507 488Z"></path><path id="MJX-TEX-N-6F" d="M28 214Q28 309 93 378T250 448Q340 448 405 380T471 215Q471 120 407 55T250 -10Q153 -10 91 57T28 214ZM250 30Q372 30 372 193V225V250Q372 272 371 288T364 326T348 362T317 390T268 410Q263 411 252 411Q222 411 195 399Q152 377 139 338T126 246V226Q126 130 145 91Q177 30 250 30Z"></path></defs></svg>

本文是「DID 从入门到精通」系列第 11 篇，完整路线见 {% post_link DID-00-Roadmap 系列导读 %}。

## 一、平行趋势预检验的局限

{% post_link DID-06-Event-Study 第 06 篇 %}我们用事件研究检验政策前的趋势：前期系数联合不显著，就认为平行趋势“通过了检验”。这是目前几乎所有实证论文的标准做法。Roth（2022）指出，这种做法存在两个严重问题。

### 问题 1：检验功效往往很低

“前期系数不显著”可能只是因为标准误太大，而不是因为趋势真的平行。来看一个模拟：

- 使用{% post_link DID-05-TWFE 第 05 篇 %}的 `make_panel`，**真实处理效应为 0**；
- 平行趋势被 **轻微违背**：处理组每年比对照组多增长 0.1（相对于结果变量的标准差来说很小）；
- 重复 300 次，每次做事件研究和前期系数的联合 F 检验。

```python
import numpy as np
import pandas as pd
import pyfixest as pf
from scipy import stats
# make_panel 函数的定义见第 05 篇

reps, passed, est_all, est_pass = 300, 0, [], []
for r in range(reps):
    d = make_panel(seed=1000 + r, effect=lambda k: 0.0 * k, pretrend=0.1)   # 真实效应为 0
    d["rel"] = np.where(d.treat == 1, d.year - 2015, -1)
    es = pf.feols("y ~ i(rel, ref=-1) | firm + year", data=d, vcov={"CRV1": "prov"})
    b, V, names = es.coef().values, es._vcov, list(es.coef().index)
    pre = [names.index(f"rel::{k}") for k in (-5, -4, -3, -2)]
    post = [names.index(f"rel::{k}") for k in range(0, 5)]
    F = b[pre] @ np.linalg.solve(V[np.ix_(pre, pre)], b[pre]) / 4
    p = 1 - stats.f.cdf(F, 4, 29)
    est_all.append(b[post].mean())                 # 政策后系数的平均值
    if p > 0.05:                                   # 通过了“平行趋势检验”
        passed += 1
        est_pass.append(b[post].mean())

print(f"通过前期趋势检验的比例: {passed / reps:.3f}")
print(f"政策后平均系数（全部模拟）: {np.mean(est_all):.3f}")
print(f"政策后平均系数（仅通过检验的）: {np.mean(est_pass):.3f}")
```

```text
通过前期趋势检验的比例: 0.793
政策后平均系数（全部模拟）: 0.342
政策后平均系数（仅通过检验的）: 0.378
```

真实效应为 0，但由于每年 0.1 的趋势差异，政策后系数（相对于 <svg aria-label="k=-1" style="vertical-align: -0.186ex;" xmlns="http://www.w3.org/2000/svg" width="7.087ex" height="1.756ex" role="img" focusable="false" viewBox="0 -694 3132.6 776" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D458" xlink:href="#MJX-TEX-I-1D458"></use></g><g data-mml-node="mo" transform="translate(798.8,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mo" transform="translate(1854.6,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="mn" transform="translate(2632.6,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g></g></g></svg>）的平均偏误理论上为 <svg aria-label="0.1 \times (1+2+3+4+5)/5 = 0.3" style="vertical-align: -0.566ex;" xmlns="http://www.w3.org/2000/svg" width="32.307ex" height="2.262ex" role="img" focusable="false" viewBox="0 -750 14279.8 1000" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mn"><use data-c="30" xlink:href="#MJX-TEX-N-30"></use><use data-c="2E" xlink:href="#MJX-TEX-N-2E" transform="translate(500,0)"></use><use data-c="31" xlink:href="#MJX-TEX-N-31" transform="translate(778,0)"></use></g><g data-mml-node="mo" transform="translate(1500.2,0)"><use data-c="D7" xlink:href="#MJX-TEX-N-D7"></use></g><g data-mml-node="mo" transform="translate(2500.4,0)"><use data-c="28" xlink:href="#MJX-TEX-N-28"></use></g><g data-mml-node="mn" transform="translate(2889.4,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g><g data-mml-node="mo" transform="translate(3611.7,0)"><use data-c="2B" xlink:href="#MJX-TEX-N-2B"></use></g><g data-mml-node="mn" transform="translate(4611.9,0)"><use data-c="32" xlink:href="#MJX-TEX-N-32"></use></g><g data-mml-node="mo" transform="translate(5334.1,0)"><use data-c="2B" xlink:href="#MJX-TEX-N-2B"></use></g><g data-mml-node="mn" transform="translate(6334.3,0)"><use data-c="33" xlink:href="#MJX-TEX-N-33"></use></g><g data-mml-node="mo" transform="translate(7056.6,0)"><use data-c="2B" xlink:href="#MJX-TEX-N-2B"></use></g><g data-mml-node="mn" transform="translate(8056.8,0)"><use data-c="34" xlink:href="#MJX-TEX-N-34"></use></g><g data-mml-node="mo" transform="translate(8779,0)"><use data-c="2B" xlink:href="#MJX-TEX-N-2B"></use></g><g data-mml-node="mn" transform="translate(9779.2,0)"><use data-c="35" xlink:href="#MJX-TEX-N-35"></use></g><g data-mml-node="mo" transform="translate(10279.2,0)"><use data-c="29" xlink:href="#MJX-TEX-N-29"></use></g><g data-mml-node="TeXAtom" data-mjx-texclass="ORD" transform="translate(10668.2,0)"><g data-mml-node="mo"><use data-c="2F" xlink:href="#MJX-TEX-N-2F"></use></g></g><g data-mml-node="mn" transform="translate(11168.2,0)"><use data-c="35" xlink:href="#MJX-TEX-N-35"></use></g><g data-mml-node="mo" transform="translate(11946,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mn" transform="translate(13001.8,0)"><use data-c="30" xlink:href="#MJX-TEX-N-30"></use><use data-c="2E" xlink:href="#MJX-TEX-N-2E" transform="translate(500,0)"></use><use data-c="33" xlink:href="#MJX-TEX-N-33" transform="translate(778,0)"></use></g></g></g></svg>。

- **79% 的模拟都“通过”了平行趋势检验**。也就是说，在这个并不夸张的设定下，绝大多数情况下研究者会认为平行趋势没问题，然后报告一个虚假的正效应。
- 检验之所以抓不住这个违背，是因为每年 0.1 的趋势差相对于估计的噪声太小了。

### 问题 2：以通过检验为条件，偏误可能更大

更微妙的是：**只在通过检验的样本中**，政策后系数的平均偏误是 0.378，比全部样本的 0.342 **还要大**。

原因是：前期系数和后期系数都相对于同一个基期 <svg aria-label="k=-1" style="vertical-align: -0.186ex;" xmlns="http://www.w3.org/2000/svg" width="7.087ex" height="1.756ex" role="img" focusable="false" viewBox="0 -694 3132.6 776" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D458" xlink:href="#MJX-TEX-I-1D458"></use></g><g data-mml-node="mo" transform="translate(798.8,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mo" transform="translate(1854.6,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="mn" transform="translate(2632.6,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g></g></g></svg> 计算，它们共享 <svg aria-label="k=-1" style="vertical-align: -0.186ex;" xmlns="http://www.w3.org/2000/svg" width="7.087ex" height="1.756ex" role="img" focusable="false" viewBox="0 -694 3132.6 776" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D458" xlink:href="#MJX-TEX-I-1D458"></use></g><g data-mml-node="mo" transform="translate(798.8,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mo" transform="translate(1854.6,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="mn" transform="translate(2632.6,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g></g></g></svg> 时的抽样误差。那些“碰巧”让前期系数看起来很平的样本，往往是 <svg aria-label="k=-1" style="vertical-align: -0.186ex;" xmlns="http://www.w3.org/2000/svg" width="7.087ex" height="1.756ex" role="img" focusable="false" viewBox="0 -694 3132.6 776" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D458" xlink:href="#MJX-TEX-I-1D458"></use></g><g data-mml-node="mo" transform="translate(798.8,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mo" transform="translate(1854.6,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="mn" transform="translate(2632.6,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g></g></g></svg> 的估计误差恰好抵消了趋势的样本，而这种误差会同时推高后期系数。Roth（2022）严格证明了这种 **预检验带来的扭曲**。

### 怎么办？

- 不要把“前期系数不显著”当作平行趋势成立的证据，而要 **报告前期系数的点估计和置信区间**，让读者判断可能的违背有多大；
- 计算 **检验功效**：如果存在某个合理大小的线性趋势，你的前期检验有多大概率发现它？Roth 的 `pretrends` 包（R / Stata）可以做这个计算；
- 更好的做法是做 **敏感性分析**：如果平行趋势被违背到某种程度，结论还成立吗？这就是下面要介绍的 HonestDiD。

## 二、线性趋势外推：一个常见但脆弱的修正

当事件研究显示明显的前期趋势时，一种常见的做法是：用前期系数拟合一条直线，假设这个趋势在政策后继续，再从政策后系数中扣除。我们用{% post_link DID-06-Event-Study 第 06 篇 %}违背平行趋势的数据试一下（处理组每年多增长 0.4，真实动态效应为 1, 1.5, 2, 2.5, 3）：

```python
dyn = lambda k: np.where(k >= 0, 1 + 0.5 * k, 0.0)
d = make_panel(seed=5, effect=dyn, pretrend=0.4)
d["rel"] = np.where(d.treat == 1, d.year - 2015, -1)
es = pf.feols("y ~ i(rel, ref=-1) | firm + year", data=d, vcov={"CRV1": "prov"})
t = es.tidy()
ks = np.array([int(s.split("::")[1]) for s in t.index])
pre = ks < 0

# 用前期系数（含基期 0）拟合线性趋势，再外推到政策后
slope = np.polyfit(np.append(ks[pre], -1), np.append(t.Estimate.values[pre], 0), 1)
adj = t.Estimate.values - np.polyval(slope, ks) + np.polyval(slope, -1)
print("估计的趋势斜率:", round(slope[0], 3))
print(pd.DataFrame({"k": ks, "原始系数": t.Estimate.values.round(3),
                    "去趋势后": adj.round(3), "真实效应": dyn(ks)}).to_string(index=False))
```

```text
估计的趋势斜率: 0.33
 k   原始系数   去趋势后  真实效应
-5 -1.449 -0.128   0.0
-4 -0.908  0.082   0.0
-3 -0.777 -0.116   0.0
-2 -0.504 -0.174   0.0
 0  1.210  0.880   1.0
 1  2.586  1.925   1.5
 2  3.498  2.508   2.0
 3  4.385  3.064   2.5
 4  4.864  3.213   3.0
```

去趋势后的结果比原始系数好得多，但仍有偏差：估计的斜率是 0.33，而真实斜率是 0.4，斜率的估计误差在外推时被逐年放大。这种方法的根本问题在于：

- 它假设趋势 **严格线性** 且在政策后 **保持不变**，这本身是一个很强的、无法检验的假设；
- 前期只有几个点时，斜率估计很不精确，外推误差随时间增大；
- 它没有把“趋势估计的不确定性”反映到最终的置信区间中。

## 三、HonestDiD：平行趋势的敏感性分析

Rambachan 和 Roth（2023）提出了一个更有原则的框架：与其假设平行趋势 **完全成立**，不如假设它 **可能被违背，但违背的程度有限**，然后在这个约束下给出处理效应的 **稳健置信区间**。

设 <svg aria-label="\delta_t" style="vertical-align: -0.357ex;" xmlns="http://www.w3.org/2000/svg" width="1.77ex" height="1.979ex" role="img" focusable="false" viewBox="0 -717 782.3 874.8" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="msub"><g data-mml-node="mi"><use data-c="1D6FF" xlink:href="#MJX-TEX-I-1D6FF"></use></g><g data-mml-node="mi" transform="translate(477,-150) scale(0.707)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g></g></g></svg> 为 <svg aria-label="t" style="vertical-align: -0.025ex;" xmlns="http://www.w3.org/2000/svg" width="0.817ex" height="1.441ex" role="img" focusable="false" viewBox="0 -626 361 637" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g></g></svg> 期平行趋势被违背的程度（处理组与对照组反事实趋势的差异）。事件研究系数可以写成：


<p style="text-align:center;overflow-x:auto;overflow-y:hidden;margin:1em 0;"><svg aria-label="\beta_t = \tau_t + \delta_t" style="vertical-align: -0.439ex;" xmlns="http://www.w3.org/2000/svg" width="11.352ex" height="2.061ex" role="img" focusable="false" viewBox="0 -717 5017.8 911" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="msub"><g data-mml-node="mi"><use data-c="1D6FD" xlink:href="#MJX-TEX-I-1D6FD"></use></g><g data-mml-node="mi" transform="translate(599,-150) scale(0.707)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g><g data-mml-node="mo" transform="translate(1182,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="msub" transform="translate(2237.8,0)"><g data-mml-node="mi"><use data-c="1D70F" xlink:href="#MJX-TEX-I-1D70F"></use></g><g data-mml-node="mi" transform="translate(470,-150) scale(0.707)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g><g data-mml-node="mo" transform="translate(3235.3,0)"><use data-c="2B" xlink:href="#MJX-TEX-N-2B"></use></g><g data-mml-node="msub" transform="translate(4235.5,0)"><g data-mml-node="mi"><use data-c="1D6FF" xlink:href="#MJX-TEX-I-1D6FF"></use></g><g data-mml-node="mi" transform="translate(477,-150) scale(0.707)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g></g></g></svg></p>


前期的 <svg aria-label="\delta_t" style="vertical-align: -0.357ex;" xmlns="http://www.w3.org/2000/svg" width="1.77ex" height="1.979ex" role="img" focusable="false" viewBox="0 -717 782.3 874.8" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="msub"><g data-mml-node="mi"><use data-c="1D6FF" xlink:href="#MJX-TEX-I-1D6FF"></use></g><g data-mml-node="mi" transform="translate(477,-150) scale(0.707)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g></g></g></svg> 可以从前期系数中估计，政策后的 <svg aria-label="\delta_t" style="vertical-align: -0.357ex;" xmlns="http://www.w3.org/2000/svg" width="1.77ex" height="1.979ex" role="img" focusable="false" viewBox="0 -717 782.3 874.8" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="msub"><g data-mml-node="mi"><use data-c="1D6FF" xlink:href="#MJX-TEX-I-1D6FF"></use></g><g data-mml-node="mi" transform="translate(477,-150) scale(0.707)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g></g></g></svg> 观测不到。HonestDiD 提供了两类常用的约束：

**1. 相对幅度约束（Relative Magnitudes）**：政策后相邻两期之间的趋势违背，不超过政策前最大违背的 <svg aria-label="\bar{M}" style="vertical-align: 0;" xmlns="http://www.w3.org/2000/svg" width="2.378ex" height="2.113ex" role="img" focusable="false" viewBox="0 -934 1051 934" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="TeXAtom" data-mjx-texclass="ORD"><g data-mml-node="mover"><g data-mml-node="mi"><use data-c="1D440" xlink:href="#MJX-TEX-I-1D440"></use></g><g data-mml-node="mo" transform="translate(629,244) translate(-250 0)"><use data-c="AF" xlink:href="#MJX-TEX-N-AF"></use></g></g></g></g></g></svg> 倍：


<p style="text-align:center;overflow-x:auto;overflow-y:hidden;margin:1em 0;"><svg aria-label="|\delta_{t+1} - \delta_t| \leq \bar{M} \cdot \max_{s &lt; 0} |\delta_{s+1} - \delta_s|" style="vertical-align: -1.758ex;" xmlns="http://www.w3.org/2000/svg" width="31.178ex" height="3.872ex" role="img" focusable="false" viewBox="0 -934 13780.7 1711.2" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mo" transform="translate(0 -0.5)"><use data-c="7C" xlink:href="#MJX-TEX-N-7C"></use></g><g data-mml-node="msub" transform="translate(278,0)"><g data-mml-node="mi"><use data-c="1D6FF" xlink:href="#MJX-TEX-I-1D6FF"></use></g><g data-mml-node="TeXAtom" transform="translate(477,-150) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mi"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g><g data-mml-node="mo" transform="translate(361,0)"><use data-c="2B" xlink:href="#MJX-TEX-N-2B"></use></g><g data-mml-node="mn" transform="translate(1139,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g></g></g><g data-mml-node="mo" transform="translate(2186.2,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="msub" transform="translate(3186.4,0)"><g data-mml-node="mi"><use data-c="1D6FF" xlink:href="#MJX-TEX-I-1D6FF"></use></g><g data-mml-node="mi" transform="translate(477,-150) scale(0.707)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g><g data-mml-node="mo" transform="translate(3968.7,0) translate(0 -0.5)"><use data-c="7C" xlink:href="#MJX-TEX-N-7C"></use></g><g data-mml-node="mo" transform="translate(4524.4,0)"><use data-c="2264" xlink:href="#MJX-TEX-N-2264"></use></g><g data-mml-node="TeXAtom" data-mjx-texclass="ORD" transform="translate(5580.2,0)"><g data-mml-node="mover"><g data-mml-node="mi"><use data-c="1D440" xlink:href="#MJX-TEX-I-1D440"></use></g><g data-mml-node="mo" transform="translate(629,244) translate(-250 0)"><use data-c="AF" xlink:href="#MJX-TEX-N-AF"></use></g></g></g><g data-mml-node="mo" transform="translate(6853.4,0)"><use data-c="22C5" xlink:href="#MJX-TEX-N-22C5"></use></g><g data-mml-node="munder" transform="translate(7353.7,0)"><g data-mml-node="mo"><use data-c="6D" xlink:href="#MJX-TEX-N-6D"></use><use data-c="61" xlink:href="#MJX-TEX-N-61" transform="translate(833,0)"></use><use data-c="78" xlink:href="#MJX-TEX-N-78" transform="translate(1333,0)"></use></g><g data-mml-node="TeXAtom" transform="translate(312.8,-648.9) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mi"><use data-c="1D460" xlink:href="#MJX-TEX-I-1D460"></use></g><g data-mml-node="mo" transform="translate(469,0)"><use data-c="3C" xlink:href="#MJX-TEX-N-3C"></use></g><g data-mml-node="mn" transform="translate(1247,0)"><use data-c="30" xlink:href="#MJX-TEX-N-30"></use></g></g></g><g data-mml-node="mo" transform="translate(9381.3,0) translate(0 -0.5)"><use data-c="7C" xlink:href="#MJX-TEX-N-7C"></use></g><g data-mml-node="msub" transform="translate(9659.3,0)"><g data-mml-node="mi"><use data-c="1D6FF" xlink:href="#MJX-TEX-I-1D6FF"></use></g><g data-mml-node="TeXAtom" transform="translate(477,-150) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mi"><use data-c="1D460" xlink:href="#MJX-TEX-I-1D460"></use></g><g data-mml-node="mo" transform="translate(469,0)"><use data-c="2B" xlink:href="#MJX-TEX-N-2B"></use></g><g data-mml-node="mn" transform="translate(1247,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g></g></g><g data-mml-node="mo" transform="translate(11643.9,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="msub" transform="translate(12644.1,0)"><g data-mml-node="mi"><use data-c="1D6FF" xlink:href="#MJX-TEX-I-1D6FF"></use></g><g data-mml-node="mi" transform="translate(477,-150) scale(0.707)"><use data-c="1D460" xlink:href="#MJX-TEX-I-1D460"></use></g></g><g data-mml-node="mo" transform="translate(13502.7,0) translate(0 -0.5)"><use data-c="7C" xlink:href="#MJX-TEX-N-7C"></use></g></g></g></svg></p>


<svg aria-label="\bar{M} = 1" style="vertical-align: -0.186ex;" xmlns="http://www.w3.org/2000/svg" width="6.526ex" height="2.299ex" role="img" focusable="false" viewBox="0 -934 2884.6 1016" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="TeXAtom" data-mjx-texclass="ORD"><g data-mml-node="mover"><g data-mml-node="mi"><use data-c="1D440" xlink:href="#MJX-TEX-I-1D440"></use></g><g data-mml-node="mo" transform="translate(629,244) translate(-250 0)"><use data-c="AF" xlink:href="#MJX-TEX-N-AF"></use></g></g></g><g data-mml-node="mo" transform="translate(1328.8,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mn" transform="translate(2384.6,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g></g></g></svg> 意味着“政策后的违背不会比政策前观察到的最坏情况更糟”。

**2. 平滑约束（Smoothness）**：趋势违背的“斜率变化”不超过 <svg aria-label="M" style="vertical-align: 0;" xmlns="http://www.w3.org/2000/svg" width="2.378ex" height="1.545ex" role="img" focusable="false" viewBox="0 -683 1051 683" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D440" xlink:href="#MJX-TEX-I-1D440"></use></g></g></g></svg>：


<p style="text-align:center;overflow-x:auto;overflow-y:hidden;margin:1em 0;"><svg aria-label="|(\delta_{t+1} - \delta_t) - (\delta_t - \delta_{t-1})| \leq M" style="vertical-align: -0.566ex;" xmlns="http://www.w3.org/2000/svg" width="29.639ex" height="2.262ex" role="img" focusable="false" viewBox="0 -750 13100.3 1000" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mo" transform="translate(0 -0.5)"><use data-c="7C" xlink:href="#MJX-TEX-N-7C"></use></g><g data-mml-node="mo" transform="translate(278,0)"><use data-c="28" xlink:href="#MJX-TEX-N-28"></use></g><g data-mml-node="msub" transform="translate(667,0)"><g data-mml-node="mi"><use data-c="1D6FF" xlink:href="#MJX-TEX-I-1D6FF"></use></g><g data-mml-node="TeXAtom" transform="translate(477,-150) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mi"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g><g data-mml-node="mo" transform="translate(361,0)"><use data-c="2B" xlink:href="#MJX-TEX-N-2B"></use></g><g data-mml-node="mn" transform="translate(1139,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g></g></g><g data-mml-node="mo" transform="translate(2575.2,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="msub" transform="translate(3575.4,0)"><g data-mml-node="mi"><use data-c="1D6FF" xlink:href="#MJX-TEX-I-1D6FF"></use></g><g data-mml-node="mi" transform="translate(477,-150) scale(0.707)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g><g data-mml-node="mo" transform="translate(4357.7,0)"><use data-c="29" xlink:href="#MJX-TEX-N-29"></use></g><g data-mml-node="mo" transform="translate(4968.9,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="mo" transform="translate(5969.1,0)"><use data-c="28" xlink:href="#MJX-TEX-N-28"></use></g><g data-mml-node="msub" transform="translate(6358.1,0)"><g data-mml-node="mi"><use data-c="1D6FF" xlink:href="#MJX-TEX-I-1D6FF"></use></g><g data-mml-node="mi" transform="translate(477,-150) scale(0.707)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g><g data-mml-node="mo" transform="translate(7362.6,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="msub" transform="translate(8362.8,0)"><g data-mml-node="mi"><use data-c="1D6FF" xlink:href="#MJX-TEX-I-1D6FF"></use></g><g data-mml-node="TeXAtom" transform="translate(477,-150) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mi"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g><g data-mml-node="mo" transform="translate(361,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="mn" transform="translate(1139,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g></g></g><g data-mml-node="mo" transform="translate(10048.8,0)"><use data-c="29" xlink:href="#MJX-TEX-N-29"></use></g><g data-mml-node="mo" transform="translate(10437.8,0) translate(0 -0.5)"><use data-c="7C" xlink:href="#MJX-TEX-N-7C"></use></g><g data-mml-node="mo" transform="translate(10993.5,0)"><use data-c="2264" xlink:href="#MJX-TEX-N-2264"></use></g><g data-mml-node="mi" transform="translate(12049.3,0)"><use data-c="1D440" xlink:href="#MJX-TEX-I-1D440"></use></g></g></g></svg></p>


<svg aria-label="M = 0" style="vertical-align: -0.186ex;" xmlns="http://www.w3.org/2000/svg" width="6.526ex" height="1.731ex" role="img" focusable="false" viewBox="0 -683 2884.6 765" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D440" xlink:href="#MJX-TEX-I-1D440"></use></g><g data-mml-node="mo" transform="translate(1328.8,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mn" transform="translate(2384.6,0)"><use data-c="30" xlink:href="#MJX-TEX-N-30"></use></g></g></g></svg> 对应于“违背是严格线性的”（即上面的线性外推），<svg aria-label="M &gt; 0" style="vertical-align: -0.09ex;" xmlns="http://www.w3.org/2000/svg" width="6.526ex" height="1.636ex" role="img" focusable="false" viewBox="0 -683 2884.6 723" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D440" xlink:href="#MJX-TEX-I-1D440"></use></g><g data-mml-node="mo" transform="translate(1328.8,0)"><use data-c="3E" xlink:href="#MJX-TEX-N-3E"></use></g><g data-mml-node="mn" transform="translate(2384.6,0)"><use data-c="30" xlink:href="#MJX-TEX-N-30"></use></g></g></g></svg> 允许趋势有一定的弯曲。

对每个 <svg aria-label="\bar M" style="vertical-align: 0;" xmlns="http://www.w3.org/2000/svg" width="2.378ex" height="2.113ex" role="img" focusable="false" viewBox="0 -934 1051 934" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="TeXAtom" data-mjx-texclass="ORD"><g data-mml-node="mover"><g data-mml-node="mi"><use data-c="1D440" xlink:href="#MJX-TEX-I-1D440"></use></g><g data-mml-node="mo" transform="translate(629,244) translate(-250 0)"><use data-c="AF" xlink:href="#MJX-TEX-N-AF"></use></g></g></g></g></g></svg>（或 <svg aria-label="M" style="vertical-align: 0;" xmlns="http://www.w3.org/2000/svg" width="2.378ex" height="1.545ex" role="img" focusable="false" viewBox="0 -683 1051 683" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D440" xlink:href="#MJX-TEX-I-1D440"></use></g></g></g></svg>），HonestDiD 给出一个稳健置信区间。随着 <svg aria-label="\bar M" style="vertical-align: 0;" xmlns="http://www.w3.org/2000/svg" width="2.378ex" height="2.113ex" role="img" focusable="false" viewBox="0 -934 1051 934" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="TeXAtom" data-mjx-texclass="ORD"><g data-mml-node="mover"><g data-mml-node="mi"><use data-c="1D440" xlink:href="#MJX-TEX-I-1D440"></use></g><g data-mml-node="mo" transform="translate(629,244) translate(-250 0)"><use data-c="AF" xlink:href="#MJX-TEX-N-AF"></use></g></g></g></g></g></svg> 增大，置信区间变宽。**使置信区间刚好包含 0 的 <svg aria-label="\bar M" style="vertical-align: 0;" xmlns="http://www.w3.org/2000/svg" width="2.378ex" height="2.113ex" role="img" focusable="false" viewBox="0 -934 1051 934" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="TeXAtom" data-mjx-texclass="ORD"><g data-mml-node="mover"><g data-mml-node="mi"><use data-c="1D440" xlink:href="#MJX-TEX-I-1D440"></use></g><g data-mml-node="mo" transform="translate(629,244) translate(-250 0)"><use data-c="AF" xlink:href="#MJX-TEX-N-AF"></use></g></g></g></g></g></svg> 叫作“临界值”（breakdown value）**。如果临界值很大（比如 <svg aria-label="\bar M = 2" style="vertical-align: -0.186ex;" xmlns="http://www.w3.org/2000/svg" width="6.526ex" height="2.299ex" role="img" focusable="false" viewBox="0 -934 2884.6 1016" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="TeXAtom" data-mjx-texclass="ORD"><g data-mml-node="mover"><g data-mml-node="mi"><use data-c="1D440" xlink:href="#MJX-TEX-I-1D440"></use></g><g data-mml-node="mo" transform="translate(629,244) translate(-250 0)"><use data-c="AF" xlink:href="#MJX-TEX-N-AF"></use></g></g></g><g data-mml-node="mo" transform="translate(1328.8,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mn" transform="translate(2384.6,0)"><use data-c="32" xlink:href="#MJX-TEX-N-32"></use></g></g></g></svg> 时结论仍然显著），说明结论对平行趋势的违背非常稳健。

HonestDiD 目前主要有 R 和 Stata 实现。你可以在 Python 中估计事件研究，把系数向量和方差矩阵导出，再交给 R 或 Stata：

```python
# 在 Python 中导出事件研究的系数和方差矩阵
es = pf.feols("y ~ i(rel, ref=-1) | firm + year", data=d, vcov={"CRV1": "prov"})
pd.Series(es.coef().values, index=es.coef().index).to_csv("betahat.csv")
pd.DataFrame(es._vcov, index=es.coef().index, columns=es.coef().index).to_csv("sigma.csv")
```

R 代码：

```r
library(HonestDiD)
betahat <- read.csv("betahat.csv")[, 2]
sigma   <- as.matrix(read.csv("sigma.csv", row.names = 1))

# 前期 4 个系数，后期 5 个系数
rm_results <- createSensitivityResults_relativeMagnitudes(
  betahat = betahat, sigma = sigma,
  numPrePeriods = 4, numPostPeriods = 5,
  Mbarvec = seq(0, 2, by = 0.5),
  l_vec = basisVector(1, 5)     # 关注政策实施当期的效应；用 rep(1/5, 5) 则关注平均效应
)
original <- constructOriginalCS(betahat, sigma, numPrePeriods = 4, numPostPeriods = 5)
createSensitivityPlot_relativeMagnitudes(rm_results, original)
```

Stata 代码：

```stata
* ssc install honestdid
reghdfe y ib5.rel_s, absorb(firm year) vce(cluster prov)
honestdid, pre(1/4) post(6/10) mvec(0(0.5)2)            // 相对幅度约束
honestdid, pre(1/4) post(6/10) mvec(0(0.1)0.5) delta(sd) // 平滑约束
```

（`pre()` 和 `post()` 是系数在回归结果中的位置，需要根据你的回归调整。）

在论文中报告 HonestDiD 的敏感性图，已经逐渐成为顶级期刊 DID 论文的标准配置。

## 四、条件平行趋势与双重稳健 DID

{% post_link DID-07-Robustness 第 07 篇 %}讨论过：当处理组和对照组在某些特征上差异很大，而这些特征又影响结果的增长趋势时，无条件的平行趋势不成立，但 **控制这些特征后** 平行趋势可能成立：


<p style="text-align:center;overflow-x:auto;overflow-y:hidden;margin:1em 0;"><svg aria-label="E[Y_{2}(0) - Y_{1}(0) \mid D=1, X] = E[Y_{2}(0) - Y_{1}(0) \mid D=0, X]" style="vertical-align: -0.566ex;" xmlns="http://www.w3.org/2000/svg" width="56.978ex" height="2.262ex" role="img" focusable="false" viewBox="0 -750 25184.2 1000" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D438" xlink:href="#MJX-TEX-I-1D438"></use></g><g data-mml-node="mo" transform="translate(764,0)"><use data-c="5B" xlink:href="#MJX-TEX-N-5B"></use></g><g data-mml-node="msub" transform="translate(1042,0)"><g data-mml-node="mi"><use data-c="1D44C" xlink:href="#MJX-TEX-I-1D44C"></use></g><g data-mml-node="TeXAtom" transform="translate(614,-150) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mn"><use data-c="32" xlink:href="#MJX-TEX-N-32"></use></g></g></g><g data-mml-node="mo" transform="translate(2059.6,0)"><use data-c="28" xlink:href="#MJX-TEX-N-28"></use></g><g data-mml-node="mn" transform="translate(2448.6,0)"><use data-c="30" xlink:href="#MJX-TEX-N-30"></use></g><g data-mml-node="mo" transform="translate(2948.6,0)"><use data-c="29" xlink:href="#MJX-TEX-N-29"></use></g><g data-mml-node="mo" transform="translate(3559.8,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="msub" transform="translate(4560,0)"><g data-mml-node="mi"><use data-c="1D44C" xlink:href="#MJX-TEX-I-1D44C"></use></g><g data-mml-node="TeXAtom" transform="translate(614,-150) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mn"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g></g></g><g data-mml-node="mo" transform="translate(5577.6,0)"><use data-c="28" xlink:href="#MJX-TEX-N-28"></use></g><g data-mml-node="mn" transform="translate(5966.6,0)"><use data-c="30" xlink:href="#MJX-TEX-N-30"></use></g><g data-mml-node="mo" transform="translate(6466.6,0)"><use data-c="29" xlink:href="#MJX-TEX-N-29"></use></g><g data-mml-node="mo" transform="translate(7133.3,0)"><use data-c="2223" xlink:href="#MJX-TEX-N-2223"></use></g><g data-mml-node="mi" transform="translate(7689.1,0)"><use data-c="1D437" xlink:href="#MJX-TEX-I-1D437"></use></g><g data-mml-node="mo" transform="translate(8794.9,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mn" transform="translate(9850.7,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g><g data-mml-node="mo" transform="translate(10350.7,0)"><use data-c="2C" xlink:href="#MJX-TEX-N-2C"></use></g><g data-mml-node="mi" transform="translate(10795.3,0)"><use data-c="1D44B" xlink:href="#MJX-TEX-I-1D44B"></use></g><g data-mml-node="mo" transform="translate(11647.3,0)"><use data-c="5D" xlink:href="#MJX-TEX-N-5D"></use></g><g data-mml-node="mo" transform="translate(12203.1,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mi" transform="translate(13258.9,0)"><use data-c="1D438" xlink:href="#MJX-TEX-I-1D438"></use></g><g data-mml-node="mo" transform="translate(14022.9,0)"><use data-c="5B" xlink:href="#MJX-TEX-N-5B"></use></g><g data-mml-node="msub" transform="translate(14300.9,0)"><g data-mml-node="mi"><use data-c="1D44C" xlink:href="#MJX-TEX-I-1D44C"></use></g><g data-mml-node="TeXAtom" transform="translate(614,-150) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mn"><use data-c="32" xlink:href="#MJX-TEX-N-32"></use></g></g></g><g data-mml-node="mo" transform="translate(15318.4,0)"><use data-c="28" xlink:href="#MJX-TEX-N-28"></use></g><g data-mml-node="mn" transform="translate(15707.4,0)"><use data-c="30" xlink:href="#MJX-TEX-N-30"></use></g><g data-mml-node="mo" transform="translate(16207.4,0)"><use data-c="29" xlink:href="#MJX-TEX-N-29"></use></g><g data-mml-node="mo" transform="translate(16818.7,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="msub" transform="translate(17818.9,0)"><g data-mml-node="mi"><use data-c="1D44C" xlink:href="#MJX-TEX-I-1D44C"></use></g><g data-mml-node="TeXAtom" transform="translate(614,-150) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mn"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g></g></g><g data-mml-node="mo" transform="translate(18836.4,0)"><use data-c="28" xlink:href="#MJX-TEX-N-28"></use></g><g data-mml-node="mn" transform="translate(19225.4,0)"><use data-c="30" xlink:href="#MJX-TEX-N-30"></use></g><g data-mml-node="mo" transform="translate(19725.4,0)"><use data-c="29" xlink:href="#MJX-TEX-N-29"></use></g><g data-mml-node="mo" transform="translate(20392.2,0)"><use data-c="2223" xlink:href="#MJX-TEX-N-2223"></use></g><g data-mml-node="mi" transform="translate(20948,0)"><use data-c="1D437" xlink:href="#MJX-TEX-I-1D437"></use></g><g data-mml-node="mo" transform="translate(22053.8,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mn" transform="translate(23109.5,0)"><use data-c="30" xlink:href="#MJX-TEX-N-30"></use></g><g data-mml-node="mo" transform="translate(23609.5,0)"><use data-c="2C" xlink:href="#MJX-TEX-N-2C"></use></g><g data-mml-node="mi" transform="translate(24054.2,0)"><use data-c="1D44B" xlink:href="#MJX-TEX-I-1D44B"></use></g><g data-mml-node="mo" transform="translate(24906.2,0)"><use data-c="5D" xlink:href="#MJX-TEX-N-5D"></use></g></g></g></svg></p>


在这个 **条件平行趋势** 假设下，有三种估计方法：

1. **回归调整（Outcome Regression，OR）**：用对照组估计 <svg aria-label="E[\Delta Y \mid X, D=0]" style="vertical-align: -0.566ex;" xmlns="http://www.w3.org/2000/svg" width="17.438ex" height="2.262ex" role="img" focusable="false" viewBox="0 -750 7707.8 1000" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D438" xlink:href="#MJX-TEX-I-1D438"></use></g><g data-mml-node="mo" transform="translate(764,0)"><use data-c="5B" xlink:href="#MJX-TEX-N-5B"></use></g><g data-mml-node="mi" transform="translate(1042,0)"><use data-c="394" xlink:href="#MJX-TEX-N-394"></use></g><g data-mml-node="mi" transform="translate(1875,0)"><use data-c="1D44C" xlink:href="#MJX-TEX-I-1D44C"></use></g><g data-mml-node="mo" transform="translate(2915.8,0)"><use data-c="2223" xlink:href="#MJX-TEX-N-2223"></use></g><g data-mml-node="mi" transform="translate(3471.6,0)"><use data-c="1D44B" xlink:href="#MJX-TEX-I-1D44B"></use></g><g data-mml-node="mo" transform="translate(4323.6,0)"><use data-c="2C" xlink:href="#MJX-TEX-N-2C"></use></g><g data-mml-node="mi" transform="translate(4768.2,0)"><use data-c="1D437" xlink:href="#MJX-TEX-I-1D437"></use></g><g data-mml-node="mo" transform="translate(5874,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mn" transform="translate(6929.8,0)"><use data-c="30" xlink:href="#MJX-TEX-N-30"></use></g><g data-mml-node="mo" transform="translate(7429.8,0)"><use data-c="5D" xlink:href="#MJX-TEX-N-5D"></use></g></g></g></svg>，对处理组预测反事实变化（Heckman 等，1997）；
2. **逆概率加权（IPW）**：用倾向得分对对照组重新加权，使其协变量分布与处理组一致（Abadie，2005）；
3. **双重稳健（Doubly Robust，DR）**：同时使用回归调整和倾向得分，**只要两个模型之一设定正确**，估计量就是一致的（Sant'Anna 和 Zhao，2020）。

用{% post_link DID-07-Robustness 第 07 篇 %} PSM-DID 的数据（两期，x1 越大的企业本来增长越快，真实效应为 2）比较：

```python
from differences import ATTgt

rng = np.random.default_rng(3)
N = 2000
x1 = rng.normal(0, 1, N); x2 = rng.normal(0, 1, N)
treat = (rng.uniform(size=N) < 1 / (1 + np.exp(-(-0.5 + 1.2 * x1 + 0.8 * x2)))).astype(int)
alpha = rng.normal(0, 2, N) + 2 * x1
rows = []
for year in (2018, 2019):
    k = year - 2018
    y = alpha + 1.0 * k + 1.5 * x1 * k + 2.0 * treat * k + rng.normal(0, 1, N)
    rows.append(pd.DataFrame({"id": np.arange(N), "year": year, "x1": x1, "x2": x2,
                              "cohort": np.where(treat == 1, 2019, np.nan), "y": y}))
pp = pd.concat(rows).set_index(["id", "year"])

for meth, fml in [("reg", "y"), ("reg", "y ~ x1 + x2"), ("std_ipw", "y ~ x1 + x2"), ("dr", "y ~ x1 + x2")]:
    a = ATTgt(data=pp, cohort_column="cohort")
    a.fit(formula=fml, est_method=meth, progress_bar=False)
    r = a.aggregate("simple")
    print(f"{meth:8s} {fml:12s} ATT = {r.iloc[0, 0]:.3f}  (SE {r.iloc[0, 1]:.3f})")
```

```text
reg      y            ATT = 3.238  (SE 0.090)
reg      y ~ x1 + x2  ATT = 2.009  (SE 0.084)
std_ipw  y ~ x1 + x2  ATT = 2.096  (SE 0.110)
dr       y ~ x1 + x2  ATT = 2.015  (SE 0.095)
```

- 不控制协变量：3.24，严重高估；
- 回归调整、IPW、双重稳健都把估计值拉回到 2 附近。在这个模拟中回归模型是正确设定的，所以 OR 和 DR 都很好；在真实数据中我们不知道哪个模型对，DR 的“双保险”就很有价值。

两个注意事项：

- **协变量应该是处理前的值**，或者不随时间变化的特征，否则会引入坏控制问题；
- 在交错 DID 中，CS 估计量天然支持 DR 方法（Stata：`csdid y x1 x2, ... method(dripw)`），这是它相对于其他新方法的一大优势。

## 五、连续处理与“强度 DID”

很多研究的处理变量不是 0/1，而是 **连续的强度**，比如：

- 各地受到某项政策影响的程度不同（关税减让幅度、补贴金额）；
- 用政策实施前的某个特征衡量“暴露程度”，再与政策后虚拟变量交互（<svg aria-label="\text{Intensity}_i \times \text{Post}_t" style="vertical-align: -0.559ex;" xmlns="http://www.w3.org/2000/svg" width="17.526ex" height="2.104ex" role="img" focusable="false" viewBox="0 -683 7746.7 930.1" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="msub"><g data-mml-node="mtext"><use data-c="49" xlink:href="#MJX-TEX-N-49"></use><use data-c="6E" xlink:href="#MJX-TEX-N-6E" transform="translate(361,0)"></use><use data-c="74" xlink:href="#MJX-TEX-N-74" transform="translate(917,0)"></use><use data-c="65" xlink:href="#MJX-TEX-N-65" transform="translate(1306,0)"></use><use data-c="6E" xlink:href="#MJX-TEX-N-6E" transform="translate(1750,0)"></use><use data-c="73" xlink:href="#MJX-TEX-N-73" transform="translate(2306,0)"></use><use data-c="69" xlink:href="#MJX-TEX-N-69" transform="translate(2700,0)"></use><use data-c="74" xlink:href="#MJX-TEX-N-74" transform="translate(2978,0)"></use><use data-c="79" xlink:href="#MJX-TEX-N-79" transform="translate(3367,0)"></use></g><g data-mml-node="mi" transform="translate(3928,-239.4) scale(0.707)"><use data-c="1D456" xlink:href="#MJX-TEX-I-1D456"></use></g></g><g data-mml-node="mo" transform="translate(4444.2,0)"><use data-c="D7" xlink:href="#MJX-TEX-N-D7"></use></g><g data-mml-node="msub" transform="translate(5444.4,0)"><g data-mml-node="mtext"><use data-c="50" xlink:href="#MJX-TEX-N-50"></use><use data-c="6F" xlink:href="#MJX-TEX-N-6F" transform="translate(681,0)"></use><use data-c="73" xlink:href="#MJX-TEX-N-73" transform="translate(1181,0)"></use><use data-c="74" xlink:href="#MJX-TEX-N-74" transform="translate(1575,0)"></use></g><g data-mml-node="mi" transform="translate(1997,-150) scale(0.707)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g></g></g></svg>）。

这类“强度 DID”在国内文献中非常常见。Callaway、Goodman-Bacon 和 Sant'Anna（2024）的研究表明，连续处理下的 TWFE 有类似甚至更复杂的问题：

- 标准平行趋势只能识别“某个强度 vs 零强度”的效应（ATT 型参数），但 **不能** 识别“强度增加一单位”的因果效应（比较不同强度之间的效应），后者需要更强的 **“强平行趋势”** 假设——不同强度的个体，如果都接受相同强度的处理，会有相同的平均效应；
- TWFE 系数是不同强度上边际效应的加权平均，权重可能不直观，在某些情况下也可能为负。

实践建议：如果有未受处理（强度为 0）的个体，可以先把强度离散化为几个区间，分别与零强度组做 DID；同时绘制效应随强度变化的图，而不是只报告一个斜率。

## 六、合成控制与合成 DID

当处理组只有 **一个或极少数几个** 个体（比如一个省、一个国家实施了某项改革）时，DID 很难找到满足平行趋势的对照组，{% post_link DID-08-Inference 第 08 篇 %}的推断问题也会很严重。这时可以考虑：

- **合成控制法**（Synthetic Control，Abadie 等，2010）：用对照组个体的加权组合，构造一个在政策前与处理组走势几乎完全一致的“合成”对照组；
- **合成 DID**（Synthetic DID，Arkhangelsky 等，2021）：结合 DID 和合成控制的优点，同时对个体和时间进行加权，然后做加权 DID。它对平行趋势的依赖比 DID 弱，又不像合成控制那样要求完全匹配处理前的水平。

```r
# R：synthdid 包
library(synthdid)
setup <- panel.matrices(df, unit = "id", time = "year", outcome = "y", treatment = "D")
tau_hat <- synthdid_estimate(setup$Y, setup$N0, setup$T0)
se <- sqrt(vcov(tau_hat, method = "placebo"))
```

```stata
* Stata：sdid 包
sdid y id year D, vce(placebo) reps(200) graph
```

## 七、其他值得关注的方向

- **非吸收型处理**：政策可以实施后又取消（处理开开关关），使用 de Chaisemartin 和 D'Haultfœuille 的 `did_multiplegt_dyn`；
- **空间溢出**：处理组会影响邻近的对照组，违背 SUTVA。Butts（2021）讨论了如何在 DID 中同时估计直接效应和溢出效应；
- **重复截面数据**：每期抽样的个体不同（如家庭调查），CS 和 DR-DID 都有重复截面版本，但要注意样本构成的变化；
- **机器学习与 DID**：用机器学习方法估计倾向得分和结果模型，再代入双重稳健公式（Chang，2020），适合协变量很多的情形。

## 八、DID 实证研究完整清单

最后，把整个系列浓缩成一份从研究设计到结果报告的清单。

### 研究设计阶段

- [ ] **明确处理是什么、何时开始**：以实施时间还是宣布时间为准？是否存在预期效应？
- [ ] **明确处理分配的层级**（个人、企业、城市、省份），它决定了聚类层级；
- [ ] **处理是否交错？** 画出处理时点分布图：有几个批次？各批次规模？有没有从未处理组？
- [ ] **选择对照组**并论证其可比性：为什么这些个体能代表处理组的反事实？
- [ ] **识别威胁清单**：同期其他政策？溢出效应？选择性进入处理组？样本构成变化？
- [ ] **确定结果变量的函数形式**（水平还是对数），并说明理由（平行趋势依赖于函数形式）。

### 描述性分析

- [ ] 处理组与对照组在处理前的描述性统计（均值、标准化差异）；
- [ ] 两组结果变量的原始均值走势图；
- [ ] 平衡面板还是非平衡面板？样本损耗是否与处理相关？

### 主回归

- [ ] **非交错**：TWFE 静态回归 + 事件研究；
- [ ] **交错**：至少一种异质性稳健估计量（CS 或插补法），同时报告 TWFE 作对比；做 Bacon 分解或报告负权重诊断；
- [ ] 明确报告估计目标（整体 ATT、动态效应、批次效应）以及汇总权重；
- [ ] 控制变量只使用处理前的值或不随时间变化的特征；条件平行趋势下考虑双重稳健估计。

### 事件研究

- [ ] 基期选择（通常为 <svg aria-label="k=-1" style="vertical-align: -0.186ex;" xmlns="http://www.w3.org/2000/svg" width="7.087ex" height="1.756ex" role="img" focusable="false" viewBox="0 -694 3132.6 776" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D458" xlink:href="#MJX-TEX-I-1D458"></use></g><g data-mml-node="mo" transform="translate(798.8,0)"><use data-c="3D" xlink:href="#MJX-TEX-N-3D"></use></g><g data-mml-node="mo" transform="translate(1854.6,0)"><use data-c="2212" xlink:href="#MJX-TEX-N-2212"></use></g><g data-mml-node="mn" transform="translate(2632.6,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g></g></g></svg>；有预期效应时提前）；
- [ ] 前期系数的点估计与置信区间，**联合检验**；
- [ ] 交错 DID 中使用新方法画图，注意相对时间上样本构成的变化；
- [ ] **HonestDiD 敏感性分析**，报告临界值。

### 统计推断

- [ ] **聚类到处理分配的层级**；
- [ ] 聚类数（尤其是处理组的聚类数）较少时，报告 wild cluster bootstrap 和/或随机化推断；
- [ ] 报告聚类数、观测值数、样本期。

### 稳健性检验（有针对性地选择）

- [ ] 时间安慰剂 / 随机化安慰剂；
- [ ] 更换对照组、剔除特殊样本、剔除邻近地区（溢出）；
- [ ] 排除同期政策；三重差分（如果有合适的第三维度）；
- [ ] 更换结果变量的度量方式；
- [ ] PSM-DID 或双重稳健 DID（如果担心可观测特征导致的趋势差异）。

### 机制与异质性

- [ ] 机制分析：政策通过什么渠道起作用？用中间变量作为被解释变量做 DID；
- [ ] 异质性分析：按事前特征分组，或在 CS 框架下按批次 / 日历时间加总。

### 报告

- [ ] 用经济含义解释效应大小（相对于均值或标准差的百分比）；
- [ ] 说明结果的适用范围（ATT 不一定能外推到未处理个体）；
- [ ] 公开代码与（可公开的）数据，保证可复现。

## 系列总结

回顾整个系列，DID 的核心其实只有一句话：

> **用对照组的变化，构造处理组的反事实变化。**

所有的复杂性都来自于对这句话的追问：

- 对照组的变化能代表处理组的反事实吗？→ **平行趋势**（第 {% post_link DID-03-Identification 03 %}、{% post_link DID-06-Event-Study 06 %}、11 篇）
- 怎么准确地算出这个差？→ **回归与固定效应**（第 {% post_link DID-04-Regression 04 %}、{% post_link DID-05-TWFE 05 %} 篇）
- 这个差是偶然的吗？→ **统计推断**（第 {% post_link DID-07-Robustness 07 %}、{% post_link DID-08-Inference 08 %} 篇）
- 对照组本身是不是“干净”的？→ **交错 DID 的新方法**（第 {% post_link DID-09-Staggered-TWFE-Problems 09 %}、{% post_link DID-10-Robust-Estimators 10 %} 篇）

DID 方法论在过去几年经历了快速的发展，很多“标准做法”被重新审视。作为实证研究者，最重要的不是记住某个命令，而是理解每种方法 **在比较什么、依赖什么假设**。只要抓住这一点，无论将来出现什么新方法，你都能很快理解它的定位。

## 推荐阅读

**综述（强烈推荐）**

- Roth, J., Sant'Anna, P. H. C., Bilinski, A., & Poe, J. (2023). What's Trending in Difference-in-Differences? A Synthesis of the Recent Econometrics Literature. *Journal of Econometrics*, 235(2), 2218–2244.
- de Chaisemartin, C., & D'Haultfœuille, X. (2023). Two-Way Fixed Effects and Differences-in-Differences with Heterogeneous Treatment Effects: A Survey. *Econometrics Journal*, 26(3), C1–C30.
- Baker, A., Callaway, B., Cunningham, S., Goodman-Bacon, A., & Sant'Anna, P. H. C. (2025). Difference-in-Differences Designs: A Practitioner's Guide. Working Paper.

**教材**

- Cunningham, S. (2021). *Causal Inference: The Mixtape*. Yale University Press. 第 9 章（免费在线版：mixtape.scunning.com）。
- Huntington-Klein, N. (2021). *The Effect: An Introduction to Research Design and Causality*. CRC Press. 第 18 章（免费在线版：theeffectbook.net）。

## 参考文献

- Roth, J. (2022). Pretest with Caution: Event-Study Estimates after Testing for Parallel Trends. *American Economic Review: Insights*, 4(3), 305–322.
- Rambachan, A., & Roth, J. (2023). A More Credible Approach to Parallel Trends. *Review of Economic Studies*, 90(5), 2555–2591.
- Sant'Anna, P. H. C., & Zhao, J. (2020). Doubly Robust Difference-in-Differences Estimators. *Journal of Econometrics*, 219(1), 101–122.
- Abadie, A. (2005). Semiparametric Difference-in-Differences Estimators. *Review of Economic Studies*, 72(1), 1–19.
- Callaway, B., Goodman-Bacon, A., & Sant'Anna, P. H. C. (2024). Difference-in-Differences with a Continuous Treatment. NBER Working Paper.
- Abadie, A., Diamond, A., & Hainmueller, J. (2010). Synthetic Control Methods for Comparative Case Studies. *Journal of the American Statistical Association*, 105(490), 493–505.
- Arkhangelsky, D., Athey, S., Hirshberg, D. A., Imbens, G. W., & Wager, S. (2021). Synthetic Difference-in-Differences. *American Economic Review*, 111(12), 4088–4118.
- Butts, K. (2021). Difference-in-Differences Estimation with Spatial Spillovers. Working Paper.
- Chang, N.-C. (2020). Double/Debiased Machine Learning for Difference-in-Differences Models. *Econometrics Journal*, 23(2), 177–191.
