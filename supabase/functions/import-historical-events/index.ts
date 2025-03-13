
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Historical events to import with detailed information - expanded to 100 events
const historicalEvents = [
  {
    year: 1945,
    description: "Raising the Flag on Iwo Jima - American soldiers raise the U.S. flag on Mount Suribachi during the Battle of Iwo Jima in World War II.",
    location_name: "Iwo Jima, Japan",
    latitude: 24.7580,
    longitude: 141.2917,
    image_title: "Raising the Flag on Iwo Jima"
  },
  {
    year: 1963,
    description: "Martin Luther King Jr. delivers his famous 'I Have a Dream' speech during the March on Washington for Jobs and Freedom, advocating for civil rights and an end to racism.",
    location_name: "Lincoln Memorial, Washington D.C., USA",
    latitude: 38.8893,
    longitude: -77.0502,
    image_title: "Martin Luther King Jr. I Have a Dream"
  },
  {
    year: 1969,
    description: "Apollo 11 Mission - Neil Armstrong becomes the first human to step on the surface of the Moon, marking a historic achievement in space exploration.",
    location_name: "Sea of Tranquility, Moon",
    latitude: 0.6744,
    longitude: 23.4322,
    image_title: "Apollo 11 first step on Moon"
  },
  {
    year: 1989,
    description: "Fall of the Berlin Wall - Citizens began dismantling the Berlin Wall, symbolizing the end of the Cold War and the reunification of East and West Germany.",
    location_name: "Berlin, Germany",
    latitude: 52.5163,
    longitude: 13.3777,
    image_title: "Berlin Wall fall 1989"
  },
  {
    year: 1955,
    description: "Rosa Parks refuses to give up her seat on a bus in Montgomery, Alabama, becoming a symbol of the Civil Rights Movement and sparking the Montgomery Bus Boycott.",
    location_name: "Montgomery, Alabama, USA",
    latitude: 32.3792,
    longitude: -86.3077,
    image_title: "Rosa Parks bus photo"
  },
  {
    year: 1912,
    description: "The RMS Titanic sinks in the North Atlantic Ocean after colliding with an iceberg during her maiden voyage, resulting in the deaths of more than 1,500 passengers and crew.",
    location_name: "North Atlantic Ocean",
    latitude: 41.7260,
    longitude: -49.9477,
    image_title: "RMS Titanic sinking"
  },
  {
    year: 1941,
    description: "Attack on Pearl Harbor - Japan launches a surprise military strike on the United States naval base at Pearl Harbor, leading to America's entry into World War II.",
    location_name: "Pearl Harbor, Hawaii, USA",
    latitude: 21.3645,
    longitude: -157.9762,
    image_title: "Attack on Pearl Harbor"
  },
  {
    year: 1986,
    description: "Chernobyl Disaster - A catastrophic nuclear accident occurs at the Chernobyl Nuclear Power Plant, releasing radioactive particles into the atmosphere and causing widespread environmental contamination.",
    location_name: "Pripyat, Ukraine (formerly USSR)",
    latitude: 51.3890,
    longitude: 30.0978,
    image_title: "Chernobyl Nuclear Power Plant disaster"
  },
  {
    year: 2001,
    description: "September 11 attacks - Terrorists hijack four passenger airplanes, crashing two into the World Trade Center in New York City, one into the Pentagon, and one in a field in Pennsylvania.",
    location_name: "New York City, New York, USA",
    latitude: 40.7115,
    longitude: -74.0134,
    image_title: "September 11 attacks World Trade Center"
  },
  {
    year: 1776,
    description: "The United States Declaration of Independence is adopted by the Continental Congress, announcing the colonies' separation from Great Britain and establishing the United States of America.",
    location_name: "Philadelphia, Pennsylvania, USA",
    latitude: 39.9483,
    longitude: -75.1678,
    image_title: "United States Declaration of Independence"
  },
  // Adding more historical events to reach 100
  {
    year: 1789,
    description: "French Revolution begins with the storming of the Bastille prison, marking the start of the overthrow of the monarchy and rise of democracy in France.",
    location_name: "Paris, France",
    latitude: 48.8534,
    longitude: 2.3488,
    image_title: "Storming of the Bastille"
  },
  {
    year: 1804,
    description: "Napoleon Bonaparte crowns himself Emperor of France, marking the end of the French Republic and beginning of the First French Empire.",
    location_name: "Notre-Dame Cathedral, Paris, France",
    latitude: 48.8530,
    longitude: 2.3499,
    image_title: "Coronation of Napoleon"
  },
  {
    year: 1815,
    description: "Battle of Waterloo - Napoleon is defeated by the Duke of Wellington and Prussian forces, ending his rule as Emperor of France.",
    location_name: "Waterloo, Belgium",
    latitude: 50.6815,
    longitude: 4.4095,
    image_title: "Battle of Waterloo"
  },
  {
    year: 1832,
    description: "The Great Reform Act is passed in the United Kingdom, introducing far-reaching changes to the electoral system and beginning the democratization process.",
    location_name: "London, United Kingdom",
    latitude: 51.5074,
    longitude: -0.1278,
    image_title: "Great Reform Act"
  },
  {
    year: 1859,
    description: "Charles Darwin publishes 'On the Origin of Species', introducing the scientific theory of evolution by natural selection.",
    location_name: "London, United Kingdom",
    latitude: 51.5074,
    longitude: -0.1278,
    image_title: "Charles Darwin Origin of Species"
  },
  {
    year: 1865,
    description: "American Civil War ends with the surrender of Confederate General Robert E. Lee, preserving the Union and ending slavery in the United States.",
    location_name: "Appomattox Court House, Virginia, USA",
    latitude: 37.3770,
    longitude: -78.7970,
    image_title: "Lee surrender at Appomattox"
  },
  {
    year: 1869,
    description: "Completion of the First Transcontinental Railroad in the United States, connecting the east and west coasts.",
    location_name: "Promontory Summit, Utah, USA",
    latitude: 41.6210,
    longitude: -112.5451,
    image_title: "Golden Spike ceremony transcontinental railroad"
  },
  {
    year: 1876,
    description: "Alexander Graham Bell patents the telephone, revolutionizing long-distance communication.",
    location_name: "Boston, Massachusetts, USA",
    latitude: 42.3601,
    longitude: -71.0589,
    image_title: "Alexander Graham Bell telephone"
  },
  {
    year: 1879,
    description: "Thomas Edison invents the practical electric light bulb, beginning the era of widespread electric lighting.",
    location_name: "Menlo Park, New Jersey, USA",
    latitude: 40.5431,
    longitude: -74.3429,
    image_title: "Thomas Edison light bulb"
  },
  {
    year: 1886,
    description: "Statue of Liberty is dedicated in New York Harbor, a gift from France symbolizing friendship and freedom.",
    location_name: "Liberty Island, New York, USA",
    latitude: 40.6892,
    longitude: -74.0445,
    image_title: "Statue of Liberty dedication"
  },
  {
    year: 1903,
    description: "Wright Brothers achieve the first powered, sustained, and controlled airplane flight near Kitty Hawk, North Carolina.",
    location_name: "Kitty Hawk, North Carolina, USA",
    latitude: 36.0797,
    longitude: -75.7088,
    image_title: "Wright Brothers first flight"
  },
  {
    year: 1905,
    description: "Albert Einstein publishes his Special Theory of Relativity, revolutionizing physics with E=mc².",
    location_name: "Bern, Switzerland",
    latitude: 46.9480,
    longitude: 7.4474,
    image_title: "Albert Einstein theory of relativity"
  },
  {
    year: 1912,
    description: "Sinking of the RMS Titanic after hitting an iceberg on its maiden voyage, resulting in over 1,500 deaths.",
    location_name: "North Atlantic Ocean",
    latitude: 41.7260,
    longitude: -49.9477,
    image_title: "RMS Titanic sinking"
  },
  {
    year: 1914,
    description: "Assassination of Archduke Franz Ferdinand of Austria in Sarajevo, triggering the start of World War I.",
    location_name: "Sarajevo, Bosnia and Herzegovina",
    latitude: 43.8563,
    longitude: 18.4131,
    image_title: "Assassination of Archduke Franz Ferdinand"
  },
  {
    year: 1917,
    description: "Russian Revolution overthrows the Tsarist autocracy and leads to the creation of the Soviet Union.",
    location_name: "Saint Petersburg, Russia",
    latitude: 59.9343,
    longitude: 30.3351,
    image_title: "Russian Revolution 1917"
  },
  {
    year: 1918,
    description: "End of World War I with the signing of the Armistice of Compiègne, ending four years of devastating conflict.",
    location_name: "Compiègne, France",
    latitude: 49.4180,
    longitude: 2.8232,
    image_title: "World War I Armistice signing"
  },
  {
    year: 1921,
    description: "Irish War of Independence ends with the Anglo-Irish Treaty, establishing the Irish Free State.",
    location_name: "Dublin, Ireland",
    latitude: 53.3498,
    longitude: -6.2603,
    image_title: "Irish War of Independence"
  },
  {
    year: 1929,
    description: "Wall Street Crash marks the beginning of the Great Depression, the worst economic downturn in modern history.",
    location_name: "New York City, New York, USA",
    latitude: 40.7067,
    longitude: -74.0088,
    image_title: "Wall Street Crash 1929"
  },
  {
    year: 1933,
    description: "Adolf Hitler becomes Chancellor of Germany, beginning the Nazi regime and setting the stage for World War II.",
    location_name: "Berlin, Germany",
    latitude: 52.5200,
    longitude: 13.4050,
    image_title: "Hitler becomes Chancellor of Germany"
  },
  // Added more events to reach 30 total
  {
    year: 1939,
    description: "World War II begins with the German invasion of Poland, leading to global conflict that would last six years.",
    location_name: "Warsaw, Poland",
    latitude: 52.2297,
    longitude: 21.0122,
    image_title: "German invasion of Poland 1939"
  },
  {
    year: 1944,
    description: "D-Day landings (Operation Overlord) begin the Allied invasion of Normandy, leading to the liberation of Western Europe.",
    location_name: "Normandy, France",
    latitude: 49.3988,
    longitude: -0.5337,
    image_title: "D-Day landings Normandy 1944"
  },
  {
    year: 1945,
    description: "Atomic bombs are dropped on Hiroshima and Nagasaki, leading to Japan's surrender and ending World War II.",
    location_name: "Hiroshima, Japan",
    latitude: 34.3853,
    longitude: 132.4553,
    image_title: "Atomic bombing of Hiroshima"
  },
  {
    year: 1947,
    description: "India and Pakistan gain independence from British rule, ending colonial rule in the Indian subcontinent.",
    location_name: "New Delhi, India",
    latitude: 28.6139,
    longitude: 77.2090,
    image_title: "Indian independence 1947"
  },
  {
    year: 1948,
    description: "State of Israel is established, declaring independence following the end of the British Mandate for Palestine.",
    location_name: "Tel Aviv, Israel",
    latitude: 32.0853,
    longitude: 34.7818,
    image_title: "Israel Declaration of Independence"
  },
  {
    year: 1949,
    description: "People's Republic of China is established with Mao Zedong as its leader after Communist victory in the Chinese Civil War.",
    location_name: "Beijing, China",
    latitude: 39.9042,
    longitude: 116.4074,
    image_title: "Mao Zedong proclaims People's Republic of China"
  },
  {
    year: 1950,
    description: "Korean War begins when North Korean forces invade South Korea, leading to a three-year conflict.",
    location_name: "Korean Peninsula",
    latitude: 38.0000,
    longitude: 127.5000,
    image_title: "Korean War beginning 1950"
  },
  {
    year: 1953,
    description: "James Watson and Francis Crick discover the double helix structure of DNA, revolutionizing molecular biology.",
    location_name: "Cambridge, United Kingdom",
    latitude: 52.2053,
    longitude: 0.1218,
    image_title: "Watson and Crick DNA model"
  },
  {
    year: 1954,
    description: "Brown v. Board of Education Supreme Court decision declares segregation in public schools unconstitutional.",
    location_name: "Washington D.C., USA",
    latitude: 38.8977,
    longitude: -77.0365,
    image_title: "Brown v Board of Education Supreme Court"
  },
  {
    year: 1957,
    description: "Soviet Union launches Sputnik 1, the first artificial Earth satellite, beginning the Space Age.",
    location_name: "Baikonur Cosmodrome, Kazakhstan",
    latitude: 45.9645,
    longitude: 63.3052,
    image_title: "Sputnik 1 satellite"
  },
  {
    year: 1961,
    description: "Yuri Gagarin becomes the first human to journey into outer space, completing one orbit around Earth.",
    location_name: "Vostok 1 orbit, Space",
    latitude: 0,
    longitude: 0,
    image_title: "Yuri Gagarin first human in space"
  },
  {
    year: 1962,
    description: "Cuban Missile Crisis brings the United States and Soviet Union to the brink of nuclear conflict.",
    location_name: "Cuba",
    latitude: 21.5218,
    longitude: -77.7812,
    image_title: "Cuban Missile Crisis"
  },
  // Added more to reach 40+ events in total
  {
    year: 1965,
    description: "Selma to Montgomery marches for voting rights lead to the passage of the Voting Rights Act in the United States.",
    location_name: "Selma, Alabama, USA",
    latitude: 32.4072,
    longitude: -87.0211,
    image_title: "Selma to Montgomery civil rights march"
  },
  {
    year: 1966,
    description: "Cultural Revolution begins in China, a sociopolitical movement launched by Mao Zedong.",
    location_name: "Beijing, China",
    latitude: 39.9042,
    longitude: 116.4074,
    image_title: "Chinese Cultural Revolution"
  },
  {
    year: 1967,
    description: "Six-Day War between Israel and neighboring Arab states reshapes the geography of the Middle East.",
    location_name: "Jerusalem",
    latitude: 31.7683,
    longitude: 35.2137,
    image_title: "Six Day War 1967"
  },
  {
    year: 1968,
    description: "Prague Spring reform movement in Czechoslovakia is crushed by Warsaw Pact invasion.",
    location_name: "Prague, Czech Republic",
    latitude: 50.0755,
    longitude: 14.4378,
    image_title: "Prague Spring Soviet tanks"
  },
  {
    year: 1969,
    description: "Woodstock Music Festival becomes a defining moment of 1960s counterculture movement.",
    location_name: "Bethel, New York, USA",
    latitude: 41.7010,
    longitude: -74.8795,
    image_title: "Woodstock Festival 1969"
  },
  {
    year: 1973,
    description: "Oil crisis begins when OPEC imposes an oil embargo, causing global economic recession.",
    location_name: "Vienna, Austria (OPEC Headquarters)",
    latitude: 48.2082,
    longitude: 16.3738,
    image_title: "1973 Oil Crisis"
  },
  {
    year: 1974,
    description: "U.S. President Richard Nixon resigns following the Watergate scandal, the only U.S. president to resign from office.",
    location_name: "Washington D.C., USA",
    latitude: 38.8977,
    longitude: -77.0365,
    image_title: "Richard Nixon resignation"
  },
  {
    year: 1975,
    description: "Fall of Saigon marks the end of the Vietnam War with North Vietnamese capture of the South Vietnamese capital.",
    location_name: "Ho Chi Minh City (formerly Saigon), Vietnam",
    latitude: 10.8231,
    longitude: 106.6297,
    image_title: "Fall of Saigon helicopter evacuation"
  },
  {
    year: 1977,
    description: "Apple Computer is incorporated and releases the Apple II, one of the first successful personal computers.",
    location_name: "Cupertino, California, USA",
    latitude: 37.3229,
    longitude: -122.0321,
    image_title: "Apple II computer 1977"
  },
  {
    year: 1979,
    description: "Iranian Revolution overthrows Shah Mohammad Reza Pahlavi and establishes an Islamic republic.",
    location_name: "Tehran, Iran",
    latitude: 35.6892,
    longitude: 51.3890,
    image_title: "Iranian Revolution 1979"
  },
  {
    year: 1980,
    description: "Solidarity trade union is formed in Poland, beginning the movement that would lead to the fall of communism.",
    location_name: "Gdańsk, Poland",
    latitude: 54.3520,
    longitude: 18.6466,
    image_title: "Solidarity movement Lech Walesa"
  },
  {
    year: 1981,
    description: "First cases of AIDS are reported in the United States, beginning the global AIDS epidemic.",
    location_name: "Los Angeles, California, USA",
    latitude: 34.0522,
    longitude: -118.2437,
    image_title: "AIDS epidemic 1980s"
  },
  {
    year: 1985,
    description: "Mikhail Gorbachev becomes leader of the Soviet Union and introduces reforms of glasnost and perestroika.",
    location_name: "Moscow, Russia",
    latitude: 55.7558,
    longitude: 37.6173,
    image_title: "Mikhail Gorbachev Soviet leader"
  },
  {
    year: 1986,
    description: "Space Shuttle Challenger disintegrates after launch, killing all seven crew members.",
    location_name: "Cape Canaveral, Florida, USA",
    latitude: 28.3922,
    longitude: -80.6077,
    image_title: "Space Shuttle Challenger disaster"
  },
  {
    year: 1989,
    description: "Tiananmen Square protests in Beijing, China are violently suppressed by the government.",
    location_name: "Beijing, China",
    latitude: 39.9054,
    longitude: 116.3976,
    image_title: "Tiananmen Square Tank Man"
  },
  {
    year: 1990,
    description: "Nelson Mandela is released from prison after 27 years, a major step toward ending apartheid in South Africa.",
    location_name: "Cape Town, South Africa",
    latitude: -33.9249,
    longitude: 18.4241,
    image_title: "Nelson Mandela release from prison"
  },
  {
    year: 1991,
    description: "Dissolution of the Soviet Union ends the Cold War era and results in the independence of 15 republics.",
    location_name: "Moscow, Russia",
    latitude: 55.7558,
    longitude: 37.6173,
    image_title: "Soviet Union dissolution 1991"
  },
  {
    year: 1994,
    description: "Rwandan Genocide sees the mass slaughter of Tutsi and moderate Hutu by Hutu extremists.",
    location_name: "Kigali, Rwanda",
    latitude: -1.9441,
    longitude: 30.0619,
    image_title: "Rwanda genocide memorial"
  },
  {
    year: 1994,
    description: "Nelson Mandela is elected President of South Africa in the country's first fully democratic election.",
    location_name: "Pretoria, South Africa",
    latitude: -25.7461,
    longitude: 28.1881,
    image_title: "Nelson Mandela president inauguration"
  },
  {
    year: 1995,
    description: "Srebrenica massacre, the genocide of more than 8,000 Bosniak men and boys during the Bosnian War.",
    location_name: "Srebrenica, Bosnia and Herzegovina",
    latitude: 44.1064,
    longitude: 19.3001,
    image_title: "Srebrenica massacre memorial"
  },
  {
    year: 1997,
    description: "Handover of Hong Kong from the United Kingdom to China, ending 156 years of British colonial rule.",
    location_name: "Hong Kong",
    latitude: 22.3193,
    longitude: 114.1694,
    image_title: "Hong Kong handover ceremony 1997"
  },
  {
    year: 1998,
    description: "Good Friday Agreement is signed, bringing peace to Northern Ireland after decades of conflict.",
    location_name: "Belfast, Northern Ireland",
    latitude: 54.5973,
    longitude: -5.9301,
    image_title: "Good Friday Agreement signing"
  },
  {
    year: 1999,
    description: "Introduction of the Euro as an accounting currency, later becoming physical currency in 2002.",
    location_name: "Frankfurt, Germany",
    latitude: 50.1109,
    longitude: 8.6821,
    image_title: "Euro currency introduction"
  },
  {
    year: 2000,
    description: "The International Space Station receives its first resident crew, beginning continuous human presence in space.",
    location_name: "International Space Station, Space",
    latitude: 0,
    longitude: 0,
    image_title: "International Space Station first crew"
  },
  {
    year: 2003,
    description: "United States-led coalition invades Iraq, beginning the Iraq War.",
    location_name: "Baghdad, Iraq",
    latitude: 33.3152,
    longitude: 44.3661,
    image_title: "Iraq War beginning 2003"
  },
  {
    year: 2004,
    description: "Indian Ocean tsunami kills over 230,000 people in 14 countries following a massive earthquake.",
    location_name: "Banda Aceh, Indonesia",
    latitude: 5.5483,
    longitude: 95.3238,
    image_title: "2004 Indian Ocean tsunami"
  },
  {
    year: 2005,
    description: "Hurricane Katrina strikes the Gulf Coast of the United States, causing catastrophic damage and over 1,800 deaths.",
    location_name: "New Orleans, Louisiana, USA",
    latitude: 29.9511,
    longitude: -90.0715,
    image_title: "Hurricane Katrina flooding New Orleans"
  },
  {
    year: 2007,
    description: "Apple introduces the iPhone, revolutionizing the mobile phone industry and personal technology.",
    location_name: "San Francisco, California, USA",
    latitude: 37.7749,
    longitude: -122.4194,
    image_title: "Steve Jobs introduces iPhone"
  },
  {
    year: 2008,
    description: "Global financial crisis begins with the collapse of Lehman Brothers, leading to the Great Recession.",
    location_name: "New York City, New York, USA",
    latitude: 40.7128,
    longitude: -74.0060,
    image_title: "Lehman Brothers collapse 2008"
  },
  {
    year: 2010,
    description: "Arab Spring begins with protests in Tunisia, spreading to several countries in the Middle East and North Africa.",
    location_name: "Tunis, Tunisia",
    latitude: 36.8065,
    longitude: 10.1815,
    image_title: "Arab Spring protests"
  },
  {
    year: 2011,
    description: "Osama bin Laden, founder of al-Qaeda and mastermind of the September 11 attacks, is killed by U.S. forces in Pakistan.",
    location_name: "Abbottabad, Pakistan",
    latitude: 34.1468,
    longitude: 73.2117,
    image_title: "Osama bin Laden compound raid"
  },
  {
    year: 2012,
    description: "Curiosity rover lands on Mars, beginning one of NASA's most ambitious missions to study the Red Planet.",
    location_name: "Gale Crater, Mars",
    latitude: 0,
    longitude: 0,
    image_title: "Curiosity rover Mars landing"
  },
  {
    year: 2013,
    description: "Edward Snowden leaks classified information from the National Security Agency, revealing global surveillance programs.",
    location_name: "Hong Kong",
    latitude: 22.3193,
    longitude: 114.1694,
    image_title: "Edward Snowden NSA whistleblower"
  },
  {
    year: 2014,
    description: "Annexation of Crimea by the Russian Federation following a controversial referendum.",
    location_name: "Sevastopol, Crimea",
    latitude: 44.6166,
    longitude: 33.5254,
    image_title: "Crimea annexation Russian flag"
  },
  {
    year: 2015,
    description: "Paris Agreement on climate change is adopted, bringing nations together to combat climate change.",
    location_name: "Paris, France",
    latitude: 48.8566,
    longitude: 2.3522,
    image_title: "Paris Agreement climate change"
  },
  {
    year: 2016,
    description: "United Kingdom votes to leave the European Union in the Brexit referendum.",
    location_name: "London, United Kingdom",
    latitude: 51.5074,
    longitude: -0.1278,
    image_title: "Brexit referendum vote"
  },
  {
    year: 2017,
    description: "Women's March becomes the largest single-day protest in U.S. history, with worldwide participation.",
    location_name: "Washington D.C., USA",
    latitude: 38.8977,
    longitude: -77.0365,
    image_title: "Women's March 2017"
  },
  {
    year: 2018,
    description: "North and South Korean leaders meet at the DMZ for historic summit, beginning a peace process.",
    location_name: "Korean Demilitarized Zone",
    latitude: 38.0000,
    longitude: 127.0000,
    image_title: "Korean leaders summit DMZ"
  },
  {
    year: 2019,
    description: "First image of a black hole is captured by the Event Horizon Telescope collaboration.",
    location_name: "M87 Galaxy",
    latitude: 0,
    longitude: 0,
    image_title: "First black hole image"
  },
  {
    year: 2020,
    description: "COVID-19 is declared a global pandemic by the World Health Organization, leading to worldwide lockdowns.",
    location_name: "Geneva, Switzerland",
    latitude: 46.2044,
    longitude: 6.1432,
    image_title: "COVID-19 pandemic"
  },
  {
    year: 2020,
    description: "Black Lives Matter protests erupt globally following the murder of George Floyd by police in Minneapolis.",
    location_name: "Minneapolis, Minnesota, USA",
    latitude: 44.9778,
    longitude: -93.2650,
    image_title: "Black Lives Matter protests 2020"
  },
  {
    year: 2021,
    description: "January 6 United States Capitol attack by supporters of President Donald Trump attempting to overturn the election results.",
    location_name: "Washington D.C., USA",
    latitude: 38.8899,
    longitude: -77.0091,
    image_title: "US Capitol riot January 6"
  },
  {
    year: 2021,
    description: "NASA's Perseverance rover lands on Mars with the Ingenuity helicopter, searching for signs of ancient life.",
    location_name: "Jezero Crater, Mars",
    latitude: 0,
    longitude: 0,
    image_title: "NASA Perseverance rover Mars landing"
  },
  {
    year: 2022,
    description: "Russia launches a full-scale invasion of Ukraine, beginning the largest conventional military attack in Europe since World War II.",
    location_name: "Kyiv, Ukraine",
    latitude: 50.4501,
    longitude: 30.5234,
    image_title: "Russian invasion of Ukraine 2022"
  },
  {
    year: 2022,
    description: "Queen Elizabeth II dies after 70 years on the British throne, ending the longest reign in British history.",
    location_name: "Balmoral Castle, Scotland",
    latitude: 57.0028,
    longitude: -3.2118,
    image_title: "Queen Elizabeth II funeral"
  },
  {
    year: 2023,
    description: "OpenAI releases ChatGPT, sparking a revolution in artificial intelligence and generative models.",
    location_name: "San Francisco, California, USA",
    latitude: 37.7749,
    longitude: -122.4194,
    image_title: "ChatGPT AI revolution"
  },
  {
    year: 1796,
    description: "Edward Jenner administers the first vaccination against smallpox, pioneering immunization.",
    location_name: "Berkeley, Gloucestershire, England",
    latitude: 51.6918,
    longitude: -2.4589,
    image_title: "Edward Jenner smallpox vaccination"
  },
  {
    year: 1823,
    description: "Monroe Doctrine is proclaimed, defining United States foreign policy toward the Western Hemisphere.",
    location_name: "Washington D.C., USA",
    latitude: 38.8977,
    longitude: -77.0365,
    image_title: "Monroe Doctrine document"
  },
  {
    year: 1848,
    description: "The Communist Manifesto is published by Karl Marx and Friedrich Engels, outlining communist theory.",
    location_name: "London, United Kingdom",
    latitude: 51.5074,
    longitude: -0.1278,
    image_title: "Communist Manifesto Marx Engels"
  },
  {
    year: 1879,
    description: "Anglo-Zulu War begins with the British invasion of Zululand in South Africa.",
    location_name: "KwaZulu-Natal, South Africa",
    latitude: -28.5306,
    longitude: 30.8958,
    image_title: "Anglo Zulu War Battle of Isandlwana"
  },
  {
    year: 1884,
    description: "Berlin Conference begins, leading to the 'Scramble for Africa' and European colonization of the continent.",
    location_name: "Berlin, Germany",
    latitude: 52.5200,
    longitude: 13.4050,
    image_title: "Berlin Conference Africa colonization"
  },
  {
    year: 1893,
    description: "New Zealand becomes the first country to grant women the right to vote in parliamentary elections.",
    location_name: "Wellington, New Zealand",
    latitude: -41.2865,
    longitude: 174.7762,
    image_title: "New Zealand women's suffrage"
  },
  {
    year: 1896,
    description: "First modern Olympic Games are held in Athens, reviving the ancient tradition.",
    location_name: "Athens, Greece",
    latitude: 37.9838,
    longitude: 23.7275,
    image_title: "First modern Olympic Games Athens 1896"
  },
  {
    year: 1908,
    description: "Ford Model T is introduced, revolutionizing automobile manufacturing and transportation.",
    location_name: "Detroit, Michigan, USA",
    latitude: 42.3314,
    longitude: -83.0458,
    image_title: "Ford Model T first automobile"
  },
  {
    year: 1919,
    description: "Treaty of Versailles is signed, formally ending World War I and reshaping Europe.",
    location_name: "Versailles, France",
    latitude: 48.8049,
    longitude: 2.1204,
    image_title: "Treaty of Versailles signing 1919"
  },
  {
    year: 1923,
    description: "Great Kantō earthquake strikes Japan, destroying Tokyo and Yokohama and killing over 140,000 people.",
    location_name: "Tokyo, Japan",
    latitude: 35.6895,
    longitude: 139.6917,
    image_title: "Great Kanto earthquake destruction 1923"
  },
  {
    year: 1925,
    description: "Scopes Monkey Trial debates teaching evolution in U.S. public schools, highlighting tension between science and religion.",
    location_name: "Dayton, Tennessee, USA",
    latitude: 35.4923,
    longitude: -85.0130,
    image_title: "Scopes Monkey Trial evolution"
  },
  {
    year: 1934,
    description: "Long March of the Chinese Communists begins, a pivotal event in Chinese Communist Party history.",
    location_name: "Jiangxi Province, China",
    latitude: 27.6140,
    longitude: 115.7221,
    image_title: "Chinese Communist Long March"
  },
  {
    year: 1935,
    description: "Nuremberg Laws are enacted in Nazi Germany, institutionalizing racial discrimination against Jews.",
    location_name: "Nuremberg, Germany",
    latitude: 49.4521,
    longitude: 11.0767,
    image_title: "Nuremberg Laws Nazi Germany"
  },
  {
    year: 1947,
    description: "The Dead Sea Scrolls are discovered in caves near Qumran, providing important insights into ancient Judaism.",
    location_name: "Qumran, West Bank",
    latitude: 31.7433,
    longitude: 35.4597,
    image_title: "Dead Sea Scrolls discovery"
  },
  {
    year: 1952,
    description: "Great Smog of London kills thousands, leading to major environmental legislation.",
    location_name: "London, United Kingdom",
    latitude: 51.5074,
    longitude: -0.1278,
    image_title: "Great Smog of London 1952"
  },
  {
    year: 1956,
    description: "Suez Crisis begins when Egypt nationalizes the Suez Canal, leading to international conflict.",
    location_name: "Suez Canal, Egypt",
    latitude: 30.0284,
    longitude: 32.5542,
    image_title: "Suez Crisis 1956"
  },
  {
    year: 1959,
    description: "Cuban Revolution succeeds as Fidel Castro's forces overthrow the Batista government.",
    location_name: "Havana, Cuba",
    latitude: 23.1136,
    longitude: -82.3666,
    image_title: "Cuban Revolution Fidel Castro"
  },
  {
    year: 1960,
    description: "First contraceptive pill is approved by the FDA, revolutionizing women's reproductive rights.",
    location_name: "Washington D.C., USA",
    latitude: 38.8977,
    longitude: -77.0365,
    image_title: "First birth control pill FDA approval"
  },
  {
    year: 1964,
    description: "Civil Rights Act is signed into law in the United States, prohibiting discrimination based on race, color, religion, sex, or national origin.",
    location_name: "Washington D.C., USA",
    latitude: 38.8977,
    longitude: -77.0365,
    image_title: "Civil Rights Act signing 1964"
  },
  {
    year: 1970,
    description: "First Earth Day is celebrated, marking the birth of the modern environmental movement.",
    location_name: "New York City, New York, USA",
    latitude: 40.7128,
    longitude: -74.0060,
    image_title: "First Earth Day celebration 1970"
  },
  {
    year: 1972,
    description: "Watergate scandal begins with the arrest of five men for breaking into the Democratic National Committee headquarters.",
    location_name: "Washington D.C., USA",
    latitude: 38.9072,
    longitude: -77.0369,
    image_title: "Watergate scandal Nixon"
  },
  {
    year: 1976,
    description: "Apple Computer Company is founded by Steve Jobs, Steve Wozniak, and Ronald Wayne.",
    location_name: "Los Altos, California, USA",
    latitude: 37.3852,
    longitude: -122.1141,
    image_title: "Apple Computer founding Steve Jobs"
  }
];

// Enhanced function to fetch image information from Wikimedia API
async function fetchWikimediaImage(searchTerm: string) {
  try {
    console.log(`Searching for image: ${searchTerm}`);
    
    // First do a search to find relevant images
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&format=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.query?.search?.length) {
      console.error(`No images found for query: ${searchTerm}`);
      
      // Try a broader search by using fewer keywords
      const simplifiedSearch = searchTerm.split(' ').slice(0, 2).join(' ');
      console.log(`Trying simplified search: ${simplifiedSearch}`);
      
      const fallbackUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(simplifiedSearch)}&srnamespace=6&format=json`;
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData = await fallbackResponse.json();
      
      if (!fallbackData.query?.search?.length) {
        console.error(`No images found for simplified query either: ${simplifiedSearch}`);
        return null;
      }
      
      // Use the first result from the simplified search
      const fileName = fallbackData.query.search[0].title.replace('File:', '');
      console.log(`Found image with simplified search: ${fileName}`);
      
      // Now get the image info
      return await getImageDetails(fileName);
    }
    
    // Get the first search result that looks like a photo (not SVG, PDF, etc.)
    let selectedFile = null;
    for (const result of searchData.query.search) {
      const fileName = result.title.replace('File:', '');
      if (!/\.(svg|pdf|ogg|mid|txt)$/i.test(fileName)) {
        selectedFile = fileName;
        break;
      }
    }
    
    if (!selectedFile) {
      // If no suitable image was found, use the first result anyway
      selectedFile = searchData.query.search[0].title.replace('File:', '');
    }
    
    console.log(`Selected image: ${selectedFile}`);
    
    // Get the image details
    return await getImageDetails(selectedFile);
    
  } catch (error) {
    console.error(`Error fetching Wikimedia image for ${searchTerm}:`, error);
    return null;
  }
}

// Helper function to get image details once we have a filename
async function getImageDetails(fileName: string) {
  try {
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url|extmetadata&format=json`;
    const infoResponse = await fetch(infoUrl);
    const infoData = await infoResponse.json();
    
    const pages = infoData.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    
    if (!pageId || !pages[pageId]?.imageinfo?.length) {
      console.error(`No image info found for file: ${fileName}`);
      return null;
    }
    
    const imageInfo = pages[pageId].imageinfo[0];
    const metadata = imageInfo.extmetadata || {};
    
    return {
      url: imageInfo.url,
      attribution: metadata.Artist?.value || 'Wikimedia Commons',
      license: metadata.License?.value || 'Unknown',
      title: fileName
    };
  } catch (error) {
    console.error(`Error getting image details for ${fileName}:`, error);
    return null;
  }
}

// Function to verify if an image URL is valid
async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.status === 200;
  } catch (error) {
    console.error(`Error verifying image URL ${url}:`, error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only POST method is allowed
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get admin credentials from environment
    const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    
    // Initialize Supabase client with admin privileges
    const supabase = createClient(supabaseUrl, supabaseAdminKey);
    
    const importResults = [];
    
    // Process each historical event
    for (const event of historicalEvents) {
      console.log(`Processing event: ${event.year} - ${event.description.substring(0, 30)}...`);
      
      // Fetch appropriate image from Wikimedia
      const imageInfo = await fetchWikimediaImage(event.image_title);
      
      if (!imageInfo) {
        importResults.push({
          year: event.year,
          description: event.description.substring(0, 30) + '...',
          status: 'failed',
          error: 'Could not find suitable image'
        });
        continue;
      }
      
      // Verify the image URL is valid
      const isImageValid = await verifyImageUrl(imageInfo.url);
      if (!isImageValid) {
        importResults.push({
          year: event.year,
          description: event.description.substring(0, 30) + '...',
          status: 'failed',
          error: 'Image URL is not valid'
        });
        continue;
      }
      
      console.log(`Image found for ${event.year} event: ${imageInfo.url}`);
      
      // Insert into Supabase database
      const { data, error } = await supabase
        .from('historical_events')
        .insert({
          year: event.year,
          description: event.description,
          location_name: event.location_name,
          latitude: event.latitude,
          longitude: event.longitude,
          image_url: imageInfo.url,
          image_attribution: imageInfo.attribution,
          image_license: imageInfo.license
        })
        .select()
        .single();
      
      if (error) {
        importResults.push({
          year: event.year,
          description: event.description.substring(0, 30) + '...',
          status: 'failed',
          error: error.message
        });
        continue;
      }
      
      importResults.push({
        year: event.year,
        description: event.description.substring(0, 30) + '...',
        status: 'success',
        id: data.id
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: `Imported ${importResults.filter(r => r.status === 'success').length} historical events successfully`,
      results: importResults
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in import-historical-events function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
