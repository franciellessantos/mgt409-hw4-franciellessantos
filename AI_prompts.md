# AI Prompts Log — HW4

A running log of every prompt sent to the AI assistant during HW4.

---

## 1. 2026-09-26
> now we will work at hw4

## 2. 2026-09-26
> create ai_prompts.md and register on it every msg i send you, to have a track of our conversations

## 3. 2026-09-26 — Project context
> context: you will buit a website + chatbot for campus customs, our store of yale stuffs for students and parents.
>
> the frontend will be build using react +vite typescript and the backend using python fastapi, using pydanticAI for the agent.
>
> our main goal is having a website where customer can easily browse products, create their accounts, chat about producs, see matchings items appear on the page, and asking about prices and stocks receive a 100% true answer.
>
> we will use this db (http://zlisto.github.io/mgt_409_fa26/data/hw4/data.zip) having info about catalogue, invetory, and users (password are hashed).
>
> we will use portkey_api_keys, using 5.6 chatgpt for build the website and 6 astra for build our agent.
>
> at the end, we will publish it on github.
>
> you must register on ai_prompts the prompt for EACH problem. i will give you the problem number and the problem name each time.

## 4. 2026-09-26 — Problem 2: Analyze the database
> now we will work here at problem 2 - analyze the database
>
> i need you take a look at data/campus_customs.db and understand, inventory, and user. show me a sample here so i can take a look too.
>
> we will write output/harness.md, and i need you write on it each table and its fields, and one brief line explaining why each field is important for the shop and for the chatbot. we will keep buiilding it, i'll let you know when update it

## 5. 2026-09-26 — Problem 3: Build the Campus Customs website
> problem 3 - build the campus customs website
>
> scaffold a react + vite + typescript front end for us. take a look at https://yalebulldogblue.com/ to understand colors and identity. it is VERY important use THE SAME font and the SAME colors. IT MUST BE A WEBSITE USING YALE VISUAL IDENTITY (https://yaleidentity.yale.edu/).  if you cant find something, let me know.
>
> we need a nav bar where the customer can see, home, products, about us, log in, create account
>
> if it is according to yale visual identity, you can add some icons to make it easier and more visual for our clients
>
> The woroding for home and about us must contain the same wording style that yalebulldogblue website, but write it like if you were me - francielle, an mba student who are studying for the very first time in the US. dont copy the text.
>
> on the 'products' page, i want imgs from catalogue, name, price and description (short) for each product. for EACH product, you'll make a single-item page, showing the img in a larger size on the left side, the FULL product text on the right, with description, price (large size), size/stocks available. When we click on a product card it MUST make the client goes to this single-product page.
>
> Add a chart interface in the bottom righ (use the yale bulldog as a icon). We will connect the agent later, but our robot will be our yale bulldog.
>
> We will need a small API soon to red the database. You can srtar with fastapi app in backend/main.py, just to feed products and imgs. later we will make it more advanced.

## 6. 2026-09-26
> open it here

## 7. 2026-09-26 — Problem 3 follow-up
> i am missing on single-product page the option to add the qtt i will wish from that product.

## 8. 2026-09-26
> open it

## 9. 2026-09-26 — Problem 4: Create account and login
> perfect, lets fo to problem 4 - create account and login
>
> create account - we will require first name, last name, email and password.
> for login, email and password.
>
> you cant accedpt an email if it is not in the format test@test.something. like, if you receive xx, it is not a valid email, if you receive xx@xx is not a real email too. use any validation process you found on internet to make it.
> if someone try an email that already exist, say that it already exist and it is not possible creat ethat account.
>
> new accoutn will be updated into user table. make sure that you are storing paswers in a way that both human and Ai CANT access them.
>
> the seed database already has a test user you can use to test all these stuffs and wahtever you  need. CONFIRM if you can login with that user and create a new one and login with it before saying that you finished it.
>
> UPDATE output/harness.md WITH HOW AUTH WORKS (what you are storing and how you are protecting password - it can be legally requested, so it is very important that you make it at the same time complete but understandable)

## 10. 2026-09-26 — Problem 4 follow-up
> doesnt the seed database have this password?

## 11. 2026-09-26 — Problem 4 follow-up
> try the password "password"

## 12. 2026-09-26 — Problem 4 follow-up
> show me the seed database

## 13. 2026-09-26 — Problem 4 follow-up
> instead of trying to insead the hash as a password, insert it as a hash, directly to the system

## 14. 2026-09-26 — Problem 4 follow-up
> ok so now create a new user and a new passowrd and test the login system

## 15. 2026-09-26 — Problem 5: PydanticAI agent backend
> problem 5 - pydanticAI agent backend
>
> we will build our chatbot now, as a pydanticAI agend using a fastAPIbehind it, plugged into our front-end chat widget. put the api in backend/main.py, that is the file that we'll run with uvicorn. keep these  files next to our agent in the backend folder
>
> prompts/prompt.md - system prompt (grow this same file later)
> agent.py - agent entry/wiring
> tools.py - tools the agent can call
> models.py - pydanticAI structured types
>
> in main.py, you'll expose a route to the chat so a msg the client wrote in the website returns a reply from the agent. we will use our API key for that. PLEASE, MAKE SURE THE CLIENT IS TALKING ABOUT A STUFF RELATED TO OUR WEBSITE, and stop it as soon you notice it is using our tokens for another purpose but converting a sale/asking about something we sell.
>
> Put campus customs voice and safety basics into prompts/promt.md (we will expand tools and safety later). Start or update types in models.py for chat replies/products card while you notice it is need.
>
> In output/harness.md, write down how the front end connects to fastAPI and how the agent is loaded (prompt and model). Make sure our backend runs from backend/ folder like this:
> uvicorn main:app --reload --port 8000

## 16. 2026-09-26
> keep all things

## 17. 2026-09-26 — Problem 6: Tools — product info and stock
> probelm 6 - tools:product info and stock
>
> we will give the agent tools info from campus_customs.db: product description, price, and how many are available in stock for each size. THIS DB will feed all agent answers. IT CANT INVENT PRICES OR QUANTITIES. It is better take a longer time to answer correctly than answer quick and wrongly. Be brief on your answers.
> Expand prompts/prompt.md in a way the agent know to call these tools when price and stock are needed. Add or updated return types in models.py.
>
> Update also output/harness.md, listing the tools used and explaining wichi model fields you chose for elaborating answers and why.

## 18. 2026-09-26 — Problem 7: Chat search that updates the page
> Problem 7 - Chat search that updates the page
>
> EVERY TIME  a customer asks about a type of a item (e.g.: "which panties do you have?") the agent MUST search the catalogue and the website MUST dynamically show the products that MATCH the question (img, name, price, short description). This is an API contract: the agent returns products in a structured wat and the front renders all of them on website.
> After that, you must ensure the single-item page is working like we designed on problem 3.
>
> Update prompts/prompt.md and output/harness to make clear how search results reach the page.

## 19. 2026-09-26 — Problem 8: Customer memory
> Problem 8 - Customer memory
>
> When a client is logged in, you must save the chat history to make it easier for them ask new questions into new sessions. Tou will save it in a database in a table and reload when they return. The agent MUST know who is chating (name and email_ - put in the agent deeps and/or tools the agent can call.
>
> Moreover, if someone is in a page, it must be included in the context to ensure if a person ask something vague (for example, if it is a specific t shirt page and the client asks about size, it is about THAT PRODUCT) you are able to reply. you can put it through code into the agent context.

## 20. 2026-09-26
> ok, now let me the link and i will access the site

## 21. 2026-09-26 — Problem 8 follow-up: documentation
> before going to problem 9, until on problem 8:
> Guests can chat, but the history wont persist.
> Document the process in output/harness.md, to have how chat history is stored, what customer fields the agent can access and how the page context is passed and used.

## 22. 2026-09-26 — Problem 9: Usability improvements
> Problem 9 - Usability improvements
>
> i took a look on the website and here are things that i guess we could improve
>
> * chat: it replied me wrong about how many products we have.
> * home: i like it
> * product: add a filter for size, for colors, for type (t-shirt, hoodie etc; add what you dont know as 'others'), for price range (break the current price range into 4 sizes, rounding for the nearest int number)
> * add on the foot that we accept zelle and mastercard and visa
> * about us: correct it. you used my tone as francielle to make students see theirselves on the about us, but YOU ARE the owner of campus customs, a long-time store providing stuffs for yale students and parents
> * login: when i go to 'create an account', the 'last name' rectangle is bigger than its section. makes  no sense.

## 23. 2026-09-26 — Problem 9 follow-up: chat result cap
> add to chat too a restriction. if a client asks something that has more than 4 products equivalents, show the 4 with more units available for that question and write "and more x"
>
> for example, if there are 6 available, show 4 and say "and more 2 products matching this search" or something like that

## 24. 2026-09-26 — Problem 9 follow-up: usability.md
> Add exactly this to the output/usability.md file. Dont change one single word.
> [verbatim usability improvements text — written to output/usability.md]

## 25. 2026-09-26
> gimme the website link again

## 26. 2026-09-26 — Problem 10: Style the website
> Problem 10 - Style the website
> I will now evaluate the design
>
> i'd like you changed:
>
> * create account must be a gray button on the extreme right.
> * when i select a section, it must be in a full rectangle (rounded borders) fully blue with white font
> * generate and save 4 imgs that show yale students in the campus wearing yale stuffs. put them on b&w. it must be a carrousel behing the "wear the blue bla bla" on the "home" page. it must pass each img each 15 seconds and repeat and you run off imgs.
> * add a truch icon on the "free campus pickup" banner
> * on about us, put the 3 main points below the text - delete the "explore the collection" CTA, and generate and put a img of a campus customs store that makes us human. it would be nice if you used a img like a student and a parent happy buying from one of our employees a yale shirt.
> * on login area, use that same img generate for about us, on b&w on the background. make it darker, like if you had a rectangle with 10% of transparency above it.
>
> you can generate these imgs using astra 6. make it as good as possible.

## 27. 2026-09-26 — Problem 10 follow-up: image generation
> now i want you verify on internet which packages you need to make you able to generate the imgs i ask you. you can install all of them and then generate the imgs we need. i am sure you can generate them,

## 28. 2026-09-26 — Problem 10 follow-up: user will supply images
> i didnt like the imgs, i will search for them and give to you. how many imgs we need and what is the min size (pxs of them)?

## 29. 2026-09-27 — Problem 10 follow-up: user supplies images
> okay, so i will give you the pics. i will drop all the 4 here, and later i will drop the final 1

## 30. 2026-09-27 — Problem 10 follow-up: carousel images supplied
> [2 pasted campus photos] @hw3/data/test_images/image_01_true.jpeg @hw3/data/test_images/image_03_true.jpeg they are the 4 imgs for your carousel. make then b&w and crop to fit the dimensions you need

## 31. 2026-09-27
> show me the page

## 32. 2026-09-27 — Problem 10 follow-up: carousel arrows must work
> I WANT THE ARROWS WORKING
> if i click, it pass. if i dont click anywhere, it pass automatically in 15 seconds. it MUST work this way.

## 33. 2026-09-27 — Problem 10 follow-up: replace 2 carousel images
> [2 b&w Yale student group photos] replace the building imgs for these two imgs. crop if necessary

## 34. 2026-09-27 — Problem 10 follow-up: home quote
> this text "when i landed..." on home should be between quotation, bc it is a srtudent saying, not the shop owner

## 35. 2026-09-27 — Problem 10 follow-up
> exclude the quotation

## 36. 2026-09-27
> show me the website again

## 37. 2026-09-27 — Problem 10 follow-up: replace Game Day band with 3 testimonial cards
> [collage of student/parent/teacher] now, we will replace it on home ["Game Day Starts Here" band] by 3 cards. each card will contain a person pic, a short text quotation and their name. one person will be a student, one a parent and another a teacher. all quotation must tell about how beloging they fell wearing our stuffs. the pics are inside this img. crop it to use. it is obvious who is each persona.

## 38. 2026-09-27 — Problem 10 follow-up: About/Login store image supplied
> [store photo: employee handing a Yale bag to a customer, parent smiling] this is the pic we will use at about us

## 39. 2026-09-27 — Problem 10 follow-up
> i want the store pic on the right side of everything, not on the foot of the page

## 40. 2026-09-27 — Problem 10 follow-up: merge login/create account
> login and create account shouldnt be different buttoms.
> use this img as the background of this new login/create account page

## 41. 2026-09-27 — Problem 10 follow-up: white backgrounds on product images
> [example quarter-zip + fleece jacket with black bg] i'd like you checked all the pics i gave you and make white the background of all of them. some are still white, but some are fully black (right) or partially black (left)

## 42. 2026-09-27
> is the website updated?

## 43. 2026-09-27
> gimme the address to the website

## 44. 2026-09-27 — Problem 10 follow-up
> i would lilke on the product website a bar to roll the filters, independent to the main bar

## 45. 2026-09-27 — Problem 10: design.md
> create the file output/design.md and put what i will write down: [design changes list — written verbatim to output/design.md]

## 46. 2026-09-27 — Problem 10
> Do you know these stuffs were related to problem 10, right?

## 47. 2026-09-27 — Problem 11: Site testing (app check)
> problem 11 - site testing (app ckech)
> we will test the site and send you evidences that everything is working like we would like. u must document it in output/app_check.html.
> i'll provide u a screenshot and a description (briefly) showing that these points are working:
> * Checking the inventory level of an item
> * Search result card after questioning about a category
> * Usability Improvement
> The HTML will have a heading, the screenshot, and the sentence i send you showing what it proves. the screenshot must be put in output/app_check_images/ ; link them from app_check.html relativing the paths (e.g. app_check_images/xxx.png)

## 48. 2026-09-27 — Fix (refines Problem 7 page-search + Problem 9 chat 4-cap)
> SKIP THE PROBLEM 11, IT IS A FIX FROM OTHER STEP
> i need a fix on the filters and i need you document it on the right place on the problems. the chat MUST show only the 4 best matches bc we dont have infinite space, but the products pages MUST be filtered for ALL references
> so if i ask about hoodies, you'll show me the 4 hoodies with larger stock, BUT the page products must be filtered for hoodies simply no matter how many hoodies will be shown all of them must be showed

## 49. 2026-09-27
> address to the page

## 50. 2026-09-27 — Problem 11: evidence #2 (search result card)
> Search result card after questioning about a category
> I searched crewnecks and it gave me back 28 correspondences, what is true. Moreover, the chat only showed me the 4 crewnecks with more items on stock (looking at the consumer perspective, i think it'd be better rank by popularity, but i don't have it here), but made it clear that we had +24 crewnecks beyond that 4 showed.

## 51. 2026-09-27 — Problem 11: evidence #1 (inventory level)
> section 1 - Inventory level for District Vit Crewneck Vintage Bulldog
> They are right both price and stock for a certain size.

## 52. 2026-09-27 — Problem 11: evidence #3 (usability improvement — filters)
> Section 3: Filters
> Given we have 100+ products, I added a filter to make the search easier. It is perfectly working, including connection to inventory to make able to filter sizes currently available

## 53. 2026-09-27 — Problem 12: Audit trails, safety, finish harness
> Problem 12 - Audit trails, safety, finish harness
> Keep an append-only output/audit_trail.json of agent-loop activity (time, tool name, short args/results, why did it stop). You cant delete past interactions, just append the new interactions to it. Also, think of some safety rules to give the agent and put them in prompts/prompt.md. It's important being compliance with yale rules... (no discrimination; help with English mistakes; never judge prices/affordability given low-income community).
> Finish output/harness.md saying how the system works in terms of model fields (models.py), and why you chose them, tools and abilities, safety rules, specs (loop limits, result caps, models, how to run front+back)

## 54. 2026-09-27 — Problem 12 follow-up: app_check images
> the output/app_check.html has the imgs corromped for me. ensure it is not corromped, please!!!! (fix: embedded the images as base64 data URIs so the HTML is self-contained and renders however it is opened; files also kept in app_check_images/)

## 55. 2026-09-27 — Problem 13: Publishing it
> Problem 13 - Publishing it. before publishing, ensure our files are organized this way. let me know if any folder/file is missing. [expected layout provided]

## 56. 2026-09-27 — Problem 13 follow-up: publishing hygiene
> rename ai_prompts.md to AI_prompts.md; requirements = deps to run; README = how to run front+back after data pack; .env.example is a placeholder — DO NOT upload real .env / campus_customs.db / product imgs to GitHub (gitignore them); local pack CAN include the real db + products, just never publish them.
