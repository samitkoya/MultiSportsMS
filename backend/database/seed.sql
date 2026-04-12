-- ============================================================
-- Multi-Sports Management System - Real-world Seed Data
-- ============================================================
-- Populates the database with realistic multi-sport sample data.
-- Real clubs, national teams, players, venues, and coaches are used
-- where confidently known. Fictional contact details and asset URLs
-- are used for non-public fields such as emails, phones, and icons.
-- ============================================================

-- ============================================================
-- SPORTS
-- ============================================================
INSERT INTO sports (name, category, max_players_per_team, min_players_per_team, scoring_unit, description, rules_json) VALUES
('Cricket', 'Outdoor', 11, 11, 'runs',
 'A bat-and-ball game played between two teams of eleven players on a field.',
 '{"overs_per_innings":20,"innings":2,"wicket_types":["bowled","caught","lbw","run_out","stumped","hit_wicket"],"extras":["wide","no_ball","bye","leg_bye"],"boundary_4":4,"boundary_6":6}'),
('Football', 'Outdoor', 11, 7, 'goals',
 'A team sport played between two teams of eleven players with a spherical ball.',
 '{"halves":2,"half_duration_minutes":45,"extra_time_minutes":30,"cards":["yellow","red"],"offside":true,"substitutions_allowed":5}'),
('Tennis', 'Outdoor', 2, 1, 'points',
 'A racket sport played individually or in doubles, organized here through national teams.',
 '{"sets_to_win":2,"games_per_set":6,"points":["0","15","30","40","deuce","advantage"],"tiebreak_at":6,"final_set_tiebreak":true}'),
('Badminton', 'Indoor', 2, 1, 'points',
 'A racket sport played using racquets to hit a shuttlecock across a net.',
 '{"sets_to_win":2,"points_per_set":21,"win_by":2,"max_points":30,"rally_point_scoring":true}');

-- ============================================================
-- VENUES
-- ============================================================
INSERT INTO venues (name, location, capacity, surface_type) VALUES
('Wankhede Stadium', 'Mumbai, India', 33000, 'Natural Turf'),
('M A Chidambaram Stadium', 'Chennai, India', 38000, 'Natural Turf'),
('M Chinnaswamy Stadium', 'Bengaluru, India', 40000, 'Natural Turf'),
('Eden Gardens', 'Kolkata, India', 68000, 'Natural Turf'),
('Rajiv Gandhi International Cricket Stadium', 'Hyderabad, India', 55000, 'Natural Turf'),
('Sawai Mansingh Stadium', 'Jaipur, India', 30000, 'Natural Turf'),
('Arun Jaitley Stadium', 'Delhi, India', 35000, 'Natural Turf'),
('Maharaja Yadavindra Singh International Cricket Stadium', 'Mullanpur, India', 38000, 'Natural Turf'),
('Narendra Modi Stadium', 'Ahmedabad, India', 132000, 'Natural Turf'),
('BRSABV Ekana Cricket Stadium', 'Lucknow, India', 50000, 'Natural Turf'),
('Melbourne Cricket Ground', 'Melbourne, Australia', 100024, 'Natural Turf'),
('Lord''s Cricket Ground', 'London, England', 31000, 'Natural Turf'),
('Gaddafi Stadium', 'Lahore, Pakistan', 27000, 'Natural Turf'),
('The Wanderers Stadium', 'Johannesburg, South Africa', 34000, 'Natural Turf'),
('Anfield', 'Liverpool, England', 61276, 'Grass'),
('Old Trafford', 'Manchester, England', 74310, 'Grass'),
('Etihad Stadium', 'Manchester, England', 53400, 'Grass'),
('Stamford Bridge', 'London, England', 40341, 'Grass'),
('Emirates Stadium', 'London, England', 60704, 'Grass'),
('Santiago Bernabeu', 'Madrid, Spain', 85000, 'Grass'),
('Estadi Olimpic Lluis Companys', 'Barcelona, Spain', 55926, 'Grass'),
('Metropolitano Stadium', 'Madrid, Spain', 70460, 'Grass'),
('Estadi Montilivi', 'Girona, Spain', 14500, 'Grass'),
('Benito Villamarin Stadium', 'Seville, Spain', 60721, 'Grass'),
('Allianz Arena', 'Munich, Germany', 75000, 'Grass'),
('Signal Iduna Park', 'Dortmund, Germany', 81365, 'Grass'),
('BayArena', 'Leverkusen, Germany', 30210, 'Grass'),
('Red Bull Arena', 'Leipzig, Germany', 47069, 'Grass'),
('MHPArena', 'Stuttgart, Germany', 60469, 'Grass'),
('Belgrade Arena', 'Belgrade, Serbia', 18000, 'Hard Court'),
('Caja Magica', 'Madrid, Spain', 12500, 'Clay'),
('Foro Italico Centre Court', 'Rome, Italy', 10500, 'Clay'),
('Arena Gdansk Tennis Centre', 'Gdansk, Poland', 8000, 'Hard Court'),
('USTA Billie Jean King National Tennis Center', 'New York, USA', 23771, 'Hard Court'),
('K D Jadhav Indoor Hall', 'New Delhi, India', 6000, 'Wooden'),
('Royal Arena', 'Copenhagen, Denmark', 13000, 'Wooden'),
('Istora Senayan', 'Jakarta, Indonesia', 7236, 'Wooden'),
('Beijing Olympic Sports Center Gymnasium', 'Beijing, China', 7000, 'Wooden'),
('SK Olympic Handball Gymnasium', 'Seoul, South Korea', 6500, 'Wooden');

-- ============================================================
-- COACHES
-- ============================================================
INSERT INTO coaches (first_name, last_name, email, phone, specialization, experience_years, coach_image_url) VALUES
('Mahela', 'Jayawardene', 'mahela.jayawardene@seed.msms.local', '+91-22-5550-0101', 'T20 Cricket Strategy', 11, 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_800,q_50/lsci/db/PICTURES/CMS/391700/391707.jpg'),
('Stephen', 'Fleming', 'stephen.fleming@seed.msms.local', '+91-44-5550-0102', 'Cricket Leadership', 16, 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_800,q_50/lsci/db/PICTURES/CMS/399800/399862.jpg'),
('Andy', 'Flower', 'andy.flower@seed.msms.local', '+91-80-5550-0103', 'Batting and Matchups', 15, 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_800,q_50/lsci/db/PICTURES/CMS/391700/391722.jpg'),
('Abhishek', 'Nayar', 'abhishek.nayar@seed.msms.local', '+91-33-5550-0104', 'Player Development', 7, 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_800,q_50/lsci/db/PICTURES/CMS/411900/411936.jpg'),
('Daniel', 'Vettori', 'daniel.vettori@seed.msms.local', '+91-40-5550-0105', 'Spin and T20 Tactics', 10, 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316400/316488.1.png'),
('Rahul', 'Dravid', 'rahul.dravid@seed.msms.local', '+91-141-5550-0106', 'Batting and Culture', 9, 'https://akm-img-a-in.tosshub.com/indiatoday/images/story/202306/rahul_dravid_reuters-one_one.jpg'),
('Hemang', 'Badani', 'hemang.badani@seed.msms.local', '+91-11-5550-0107', 'White-ball Cricket', 5, 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_800,q_50/lsci/db/PICTURES/CMS/399300/399360.jpg'),
('Ricky', 'Ponting', 'ricky.ponting@seed.msms.local', '+91-172-5550-0108', 'T20 Leadership', 13, 'https://c.ndtvimg.com/2019-04/9gq22ks8_ricky-ponting-delhi-capitals-bcciipl_625x300_05_April_19.jpg'),
('Ashish', 'Nehra', 'ashish.nehra@seed.msms.local', '+91-79-5550-0109', 'Fast Bowling and T20 Plans', 8, 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_800,q_50/lsci/db/PICTURES/CMS/400400/400449.jpg'),
('Justin', 'Langer', 'justin.langer@seed.msms.local', '+91-522-5550-0110', 'High Performance Cricket', 14, 'https://i.guim.co.uk/img/media/9821ae152fc00fa0b7539ba085033b5a1525d722/0_101_3000_1800/master/3000.jpg'),
('Gautam', 'Gambhir', 'gautam.gambhir@seed.msms.local', '+91-79-5550-0111', 'International Cricket', 4, 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_480,q_50/lsci/db/PICTURES/CMS/412600/412623.10.png'),
('Andrew', 'McDonald', 'andrew.mcdonald@seed.msms.local', '+61-3-5550-0112', 'International Cricket', 6, 'https://www.wisden.com/static-assets/waf-images/58/f3/1d/4-3/600422_Copy-of-Quote-piece-39.png'),
('Brendon', 'McCullum', 'brendon.mccullum@seed.msms.local', '+44-20-5550-0113', 'Aggressive White-ball Cricket', 8, 'https://www.aljazeera.com/wp-content/uploads/2024/09/GettyImages-2062939975-1725374145.jpg'),
('Aaqib', 'Javed', 'aaqib.javed@seed.msms.local', '+92-42-5550-0114', 'Fast Bowling and T20 Plans', 7, 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_800,q_50/lsci/db/PICTURES/CMS/395300/395353.jpg'),
('Shukri', 'Conrad', 'shukri.conrad@seed.msms.local', '+27-11-5550-0115', 'International Cricket', 6, 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_800,q_50/lsci/db/PICTURES/CMS/405600/405670.jpg'),
('Arne', 'Slot', 'arne.slot@seed.msms.local', '+44-151-5550-0201', 'Football Tactics', 12, 'https://r2.thesportsdb.com/images/media/player/thumb/slth571679175046.jpg'),
('Michael', 'Carrick', 'michael.carrick@seed.msms.local', '+44-161-5550-0202', 'Midfield Structure', 5, 'https://r2.thesportsdb.com/images/media/player/thumb/bamv7p1731788942.jpg'),
('Pep', 'Guardiola', 'pep.guardiola@seed.msms.local', '+44-161-5550-0203', 'Positional Play', 18, 'https://r2.thesportsdb.com/images/media/player/thumb/m4vfto1767952704.jpg'),
('Enzo', 'Maresca', 'enzo.maresca@seed.msms.local', '+44-20-5550-0204', 'Ball Progression', 6, 'https://r2.thesportsdb.com/images/media/player/thumb/gclale1689775058.jpg'),
('Mikel', 'Arteta', 'mikel.arteta@seed.msms.local', '+44-20-5550-0205', 'Pressing Structure', 9, 'https://r2.thesportsdb.com/images/media/player/thumb/kgojrb1711448509.jpg'),
('Carlo', 'Ancelotti', 'carlo.ancelotti@seed.msms.local', '+34-91-5550-0206', 'Elite Match Management', 24, 'https://r2.thesportsdb.com/images/media/player/thumb/jbdjl01576946407.jpg'),
('Hansi', 'Flick', 'hansi.flick@seed.msms.local', '+34-93-5550-0207', 'High Pressing Football', 12, 'https://r2.thesportsdb.com/images/media/player/thumb/59yosg1771261273.jpg'),
('Diego', 'Simeone', 'diego.simeone@seed.msms.local', '+34-91-5550-0208', 'Defensive Organization', 14, 'https://r2.thesportsdb.com/images/media/player/thumb/2f8abw1534444128.jpg'),
('Michel', 'Sanchez', 'michel.sanchez@seed.msms.local', '+34-972-5550-0209', 'Attacking Transitions', 7, 'https://cdn-img.zerozero.pt/img/treinadores/529/26529_pri__20251101122032_michel.png'),
('Manuel', 'Pellegrini', 'manuel.pellegrini@seed.msms.local', '+34-95-5550-0210', 'Game Control', 20, 'https://r2.thesportsdb.com/images/media/player/thumb/0l2l4x1549370848.jpg'),
('Vincent', 'Kompany', 'vincent.kompany@seed.msms.local', '+49-89-5550-0211', 'Front-foot Football', 5, 'https://r2.thesportsdb.com/images/media/player/thumb/61nzv01711379522.jpg'),
('Niko', 'Kovac', 'niko.kovac@seed.msms.local', '+49-231-5550-0212', 'Competitive Structure', 10, 'https://r2.thesportsdb.com/images/media/player/thumb/vf2rm61610651813.jpg'),
('Xabi', 'Alonso', 'xabi.alonso@seed.msms.local', '+49-214-5550-0213', 'Build-up and Pressing', 6, 'https://r2.thesportsdb.com/images/media/player/thumb/cdvpef1764082585.jpg'),
('Marco', 'Rose', 'marco.rose@seed.msms.local', '+49-341-5550-0214', 'Transition Football', 9, 'https://r2.thesportsdb.com/images/media/player/thumb/axfyog1603548254.jpg'),
('Sebastian', 'Hoeness', 'sebastian.hoeness@seed.msms.local', '+49-711-5550-0215', 'Attacking Shape', 7, 'https://r2.thesportsdb.com/images/media/player/thumb/15icm91741453533.jpg'),
('Viktor', 'Troicki', 'viktor.troicki@seed.msms.local', '+381-11-5550-0301', 'Tennis Davis Cup Coaching', 6, 'https://www.claytenis.com/wp-content/uploads/2024/07/Djokovic-viktor-troicki.jpeg'),
('David', 'Ferrer', 'david.ferrer@seed.msms.local', '+34-91-5550-0302', 'Clay Court Tennis', 4, 'https://www.tennisviewmag.com/sites/default/files/styles/large/public/david-ferrer-tennis.jpg'),
('Filippo', 'Volandri', 'filippo.volandri@seed.msms.local', '+39-06-5550-0303', 'Tennis Team Leadership', 5, 'https://www.tennisnerd.net/wp-content/uploads/2016/05/filippo_volandri_GS17550.jpg'),
('Dawid', 'Celt', 'dawid.celt@seed.msms.local', '+48-58-5550-0304', 'Women''s Tennis Coaching', 7, 'https://po-bandzie.com.pl/wp-content/uploads/2021/01/celt.jpg'),
('Bob', 'Bryan', 'bob.bryan@seed.msms.local', '+1-718-5550-0305', 'Doubles and Team Tennis', 4, 'https://sportsmatik.com/uploads/world-events/players/bob-bryan_1577535087.jpg'),
('Pullela', 'Gopichand', 'pullela.gopichand@seed.msms.local', '+91-11-5550-0401', 'Badminton Singles', 18, 'https://static.toiimg.com/thumb/msid-60393305,width-400,resizemode-4/60393305.jpg'),
('Kenneth', 'Jonassen', 'kenneth.jonassen@seed.msms.local', '+45-32-5550-0402', 'Badminton Team Coaching', 11, 'https://bam.org.my/sites/default/files/coach/20250218Yonex14867.jpg'),
('Eng', 'Hian', 'eng.hian@seed.msms.local', '+62-21-5550-0403', 'Doubles Development', 9, 'https://awsimages.detik.net.id/community/media/visual/2024/04/30/eng-hian_169.jpeg'),
('Xia', 'Xuanze', 'xia.xuanze@seed.msms.local', '+86-10-5550-0404', 'Elite Badminton', 10, 'https://asset.indosport.com/article/image/q/80/312943/pelatih_tim_putra_china_xia_xuanze-169.jpg'),
('Ra', 'Kyung-min', 'ra.kyungmin@seed.msms.local', '+82-2-5550-0405', 'Badminton Team Development', 8, 'https://sportsnerdy.com/wp-content/uploads/2025/09/ra_kyung_min.webp');

-- ============================================================
-- TEAMS
-- Team order is intentional so later inserts can refer to stable ids.
-- 1-10: IPL clubs
-- 11-15: ICC national teams
-- 16-30: Football clubs
-- 31-35: Tennis national teams
-- 36-40: Badminton national teams
-- ============================================================
INSERT INTO teams (name, sport_id, coach_id, founded_year, home_venue_id, team_image_url, status) VALUES
('Mumbai Indians', 1, 1, 2008, 1, 'https://r2.thesportsdb.com/images/media/team/badge/l40j8p1487678631.png', 'active'),
('Chennai Super Kings', 1, 2, 2008, 2, 'https://r2.thesportsdb.com/images/media/team/badge/okceh51487601098.png', 'active'),
('Royal Challengers Bengaluru', 1, 3, 2008, 3, 'https://r2.thesportsdb.com/images/media/team/badge/kynj5v1588331757.png', 'active'),
('Kolkata Knight Riders', 1, 4, 2008, 4, 'https://r2.thesportsdb.com/images/media/team/badge/ows99r1487678296.png', 'active'),
('Sunrisers Hyderabad', 1, 5, 2012, 5, 'https://r2.thesportsdb.com/images/media/team/badge/sc7m161487419327.png', 'active'),
('Rajasthan Royals', 1, 6, 2008, 6, 'https://r2.thesportsdb.com/images/media/team/badge/lehnfw1487601864.png', 'active'),
('Delhi Capitals', 1, 7, 2008, 7, 'https://r2.thesportsdb.com/images/media/team/badge/dg4g0z1587334054.png', 'active'),
('Punjab Kings', 1, 8, 2008, 8, 'https://r2.thesportsdb.com/images/media/team/badge/r1tcie1630697821.png', 'active'),
('Gujarat Titans', 1, 9, 2021, 9, 'https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Gujarat_Titans_Logo.svg/1280px-Gujarat_Titans_Logo.svg.png', 'active'),
('Lucknow Super Giants', 1, 10, 2021, 10, 'https://r2.thesportsdb.com/images/media/team/badge/4tzmfa1647445839.png', 'active'),
('India', 1, 11, 1932, 9, 'https://r2.thesportsdb.com/images/media/team/badge/donl7g1646775159.png', 'active'),
('Australia', 1, 12, 1877, 11, 'https://r2.thesportsdb.com/images/media/team/badge/zvm8581646775132.png', 'active'),
('England', 1, 13, 1877, 12, 'https://r2.thesportsdb.com/images/media/team/badge/y5wcl81646775152.png', 'active'),
('Pakistan', 1, 14, 1952, 13, 'https://r2.thesportsdb.com/images/media/team/badge/03o8241646775177.png', 'active'),
('South Africa', 1, 15, 1889, 14, 'https://r2.thesportsdb.com/images/media/team/badge/hn47e51646775185.png', 'active'),
('Liverpool', 2, 16, 1892, 15, 'https://r2.thesportsdb.com/images/media/team/badge/kfaher1737969724.png', 'active'),
('Manchester United', 2, 17, 1878, 16, 'https://r2.thesportsdb.com/images/media/team/badge/xzqdr11517660252.png', 'active'),
('Manchester City', 2, 18, 1880, 17, 'https://r2.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png', 'active'),
('Chelsea', 2, 19, 1905, 18, 'https://r2.thesportsdb.com/images/media/team/badge/yvwvtu1448813215.png', 'active'),
('Arsenal', 2, 20, 1886, 19, 'https://r2.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png', 'active'),
('Real Madrid', 2, 21, 1902, 20, 'https://r2.thesportsdb.com/images/media/team/badge/vwvwrw1473502969.png', 'active'),
('Barcelona', 2, 22, 1899, 21, 'https://r2.thesportsdb.com/images/media/team/badge/wq9sir1639406443.png', 'active'),
('Atletico Madrid', 2, 23, 1903, 22, 'https://r2.thesportsdb.com/images/media/team/badge/0ulh3q1719984315.png', 'active'),
('Girona', 2, 24, 1930, 23, 'https://r2.thesportsdb.com/images/media/team/badge/kfu7zu1659897499.png', 'active'),
('Real Betis', 2, 25, 1907, 24, 'https://r2.thesportsdb.com/images/media/team/badge/2oqulv1663245386.png', 'active'),
('Bayern Munich', 2, 26, 1900, 25, 'https://r2.thesportsdb.com/images/media/team/badge/01ogkh1716960412.png', 'active'),
('Borussia Dortmund', 2, 27, 1909, 26, 'https://r2.thesportsdb.com/images/media/team/badge/tqo8ge1716960353.png', 'active'),
('Bayer Leverkusen', 2, 28, 1904, 27, 'https://r2.thesportsdb.com/images/media/team/badge/3x9k851726760113.png', 'active'),
('RB Leipzig', 2, 29, 2009, 28, 'https://r2.thesportsdb.com/images/media/team/badge/zjgapo1594244951.png', 'active'),
('VfB Stuttgart', 2, 30, 1893, 29, 'https://r2.thesportsdb.com/images/media/team/badge/yppyux1473454085.png', 'active'),
('Serbia', 3, 31, 2006, 30, 'https://r2.thesportsdb.com/images/media/team/badge/yndre51640787184.png', 'active'),
('Spain', 3, 32, 1909, 31, 'https://r2.thesportsdb.com/images/media/team/badge/sjl2bn1640787598.png', 'active'),
('Italy', 3, 33, 1910, 32, 'https://r2.thesportsdb.com/images/media/team/badge/8tnnts1654504201.png', 'active'),
('Poland', 3, 34, 1921, 33, 'https://r2.thesportsdb.com/images/media/team/badge/tvxwdc1654464661.png', 'active'),
('United States', 3, 35, 1881, 34, 'https://r2.thesportsdb.com/images/media/team/badge/8n14z41636883904.png', 'active'),
('India Badminton', 4, 36, 1934, 35, 'https://r2.thesportsdb.com/images/media/team/badge/r3ukmo1697364040.png', 'active'),
('Denmark Badminton', 4, 37, 1930, 36, 'https://r2.thesportsdb.com/images/media/team/badge/lka8yo1697363107.png', 'active'),
('Indonesia Badminton', 4, 38, 1951, 37, 'https://upload.wikimedia.org/wikipedia/en/9/9e/Badminton_Association_of_Indonesia_logo.png', 'active'),
('China Badminton', 4, 39, 1958, 38, 'https://r2.thesportsdb.com/images/media/team/badge/2udonw1697364832.png', 'active'),
('South Korea Badminton', 4, 40, 1957, 39, 'https://bka-s3-bucket.s3.ap-northeast-2.amazonaws.com/2025/02/17/07549ae4-9139-44a4-9098-9464450ee997_KakaoTalk_20250217_002127914.jpg', 'active');

-- ============================================================
-- PLAYERS
-- Football clubs
-- ============================================================
INSERT INTO players (first_name, last_name, email, date_of_birth, gender, team_id, jersey_number, position, status, player_image_url) VALUES
('Alisson', 'Becker', 'alisson.becker@seed.msms.local', '1992-10-02', 'Male', 16, 1, 'Goalkeeper', 'active', ''),
('Virgil', 'van Dijk', 'virgil.vandijk@seed.msms.local', '1991-07-08', 'Male', 16, 4, 'Defender', 'active', ''),
('Trent', 'Alexander-Arnold', 'trent.alexander-arnold@seed.msms.local', '1998-10-07', 'Male', 16, 66, 'Defender', 'active', ''),
('Alexis', 'Mac Allister', 'alexis.macallister@seed.msms.local', '1998-12-24', 'Male', 16, 10, 'Midfielder', 'active', ''),
('Dominik', 'Szoboszlai', 'dominik.szoboszlai@seed.msms.local', '2000-10-25', 'Male', 16, 8, 'Midfielder', 'active', ''),
('Mohamed', 'Salah', 'mohamed.salah@seed.msms.local', '1992-06-15', 'Male', 16, 11, 'Forward', 'active', ''),
('Luis', 'Diaz', 'luis.diaz@seed.msms.local', '1997-01-13', 'Male', 16, 7, 'Forward', 'active', ''),

('Andre', 'Onana', 'andre.onana@seed.msms.local', '1996-04-02', 'Male', 17, 24, 'Goalkeeper', 'active', ''),
('Lisandro', 'Martinez', 'lisandro.martinez@seed.msms.local', '1998-01-18', 'Male', 17, 6, 'Defender', 'active', ''),
('Bruno', 'Fernandes', 'bruno.fernandes@seed.msms.local', '1994-09-08', 'Male', 17, 8, 'Midfielder', 'active', ''),
('Kobbie', 'Mainoo', 'kobbie.mainoo@seed.msms.local', '2005-04-19', 'Male', 17, 37, 'Midfielder', 'active', ''),
('Amad', 'Diallo', 'amad.diallo@seed.msms.local', '2002-07-11', 'Male', 17, 16, 'Forward', 'active', ''),
('Alejandro', 'Garnacho', 'alejandro.garnacho@seed.msms.local', '2004-07-01', 'Male', 17, 17, 'Forward', 'active', ''),
('Rasmus', 'Hojlund', 'rasmus.hojlund@seed.msms.local', '2003-02-04', 'Male', 17, 9, 'Forward', 'active', ''),

('Ederson', 'Moraes', 'ederson.moraes@seed.msms.local', '1993-08-17', 'Male', 18, 31, 'Goalkeeper', 'active', ''),
('Ruben', 'Dias', 'ruben.dias@seed.msms.local', '1997-05-14', 'Male', 18, 3, 'Defender', 'active', ''),
('Rodri', 'Hernandez', 'rodri.hernandez@seed.msms.local', '1996-06-22', 'Male', 18, 16, 'Midfielder', 'active', ''),
('Kevin', 'De Bruyne', 'kevin.debruyne@seed.msms.local', '1991-06-28', 'Male', 18, 17, 'Midfielder', 'active', ''),
('Bernardo', 'Silva', 'bernardo.silva@seed.msms.local', '1994-08-10', 'Male', 18, 20, 'Midfielder', 'active', ''),
('Phil', 'Foden', 'phil.foden@seed.msms.local', '2000-05-28', 'Male', 18, 47, 'Forward', 'active', ''),
('Erling', 'Haaland', 'erling.haaland@seed.msms.local', '2000-07-21', 'Male', 18, 9, 'Forward', 'active', ''),

('Robert', 'Sanchez', 'robert.sanchez@seed.msms.local', '1997-11-18', 'Male', 19, 1, 'Goalkeeper', 'active', ''),
('Levi', 'Colwill', 'levi.colwill@seed.msms.local', '2003-02-26', 'Male', 19, 6, 'Defender', 'active', ''),
('Reece', 'James', 'reece.james@seed.msms.local', '1999-12-08', 'Male', 19, 24, 'Defender', 'active', ''),
('Moises', 'Caicedo', 'moises.caicedo@seed.msms.local', '2001-11-02', 'Male', 19, 25, 'Midfielder', 'active', ''),
('Enzo', 'Fernandez', 'enzo.fernandez@seed.msms.local', '2001-01-17', 'Male', 19, 8, 'Midfielder', 'active', ''),
('Cole', 'Palmer', 'cole.palmer@seed.msms.local', '2002-05-06', 'Male', 19, 20, 'Forward', 'active', ''),
('Nicolas', 'Jackson', 'nicolas.jackson@seed.msms.local', '2001-06-20', 'Male', 19, 15, 'Forward', 'active', ''),

('David', 'Raya', 'david.raya@seed.msms.local', '1995-09-15', 'Male', 20, 22, 'Goalkeeper', 'active', ''),
('William', 'Saliba', 'william.saliba@seed.msms.local', '2001-03-24', 'Male', 20, 2, 'Defender', 'active', ''),
('Gabriel', 'Magalhaes', 'gabriel.magalhaes@seed.msms.local', '1997-12-19', 'Male', 20, 6, 'Defender', 'active', ''),
('Declan', 'Rice', 'declan.rice@seed.msms.local', '1999-01-14', 'Male', 20, 41, 'Midfielder', 'active', ''),
('Martin', 'Odegaard', 'martin.odegaard@seed.msms.local', '1998-12-17', 'Male', 20, 8, 'Midfielder', 'active', ''),
('Bukayo', 'Saka', 'bukayo.saka@seed.msms.local', '2001-09-05', 'Male', 20, 7, 'Forward', 'active', ''),
('Kai', 'Havertz', 'kai.havertz@seed.msms.local', '1999-06-11', 'Male', 20, 29, 'Forward', 'active', ''),

('Thibaut', 'Courtois', 'thibaut.courtois@seed.msms.local', '1992-05-11', 'Male', 21, 1, 'Goalkeeper', 'active', ''),
('Antonio', 'Rudiger', 'antonio.rudiger@seed.msms.local', '1993-03-03', 'Male', 21, 22, 'Defender', 'active', ''),
('Federico', 'Valverde', 'federico.valverde@seed.msms.local', '1998-07-22', 'Male', 21, 8, 'Midfielder', 'active', ''),
('Jude', 'Bellingham', 'jude.bellingham@seed.msms.local', '2003-06-29', 'Male', 21, 5, 'Midfielder', 'active', ''),
('Vinicius', 'Junior', 'vinicius.junior@seed.msms.local', '2000-07-12', 'Male', 21, 7, 'Forward', 'active', ''),
('Rodrygo', 'Goes', 'rodrygo.goes@seed.msms.local', '2001-01-09', 'Male', 21, 11, 'Forward', 'active', ''),
('Kylian', 'Mbappe', 'kylian.mbappe@seed.msms.local', '1998-12-20', 'Male', 21, 9, 'Forward', 'active', ''),

('Marc-Andre', 'ter Stegen', 'marc-andre.terstegen@seed.msms.local', '1992-04-30', 'Male', 22, 1, 'Goalkeeper', 'active', ''),
('Ronald', 'Araujo', 'ronald.araujo@seed.msms.local', '1999-03-07', 'Male', 22, 4, 'Defender', 'active', ''),
('Pedri', 'Gonzalez', 'pedri.gonzalez@seed.msms.local', '2002-11-25', 'Male', 22, 8, 'Midfielder', 'active', ''),
('Frenkie', 'de Jong', 'frenkie.dejong@seed.msms.local', '1997-05-12', 'Male', 22, 21, 'Midfielder', 'active', ''),
('Lamine', 'Yamal', 'lamine.yamal@seed.msms.local', '2007-07-13', 'Male', 22, 19, 'Forward', 'active', ''),
('Raphinha', 'Bellos', 'raphinha.bellos@seed.msms.local', '1996-12-14', 'Male', 22, 11, 'Forward', 'active', ''),
('Robert', 'Lewandowski', 'robert.lewandowski@seed.msms.local', '1988-08-21', 'Male', 22, 9, 'Forward', 'active', ''),

('Jan', 'Oblak', 'jan.oblak@seed.msms.local', '1993-01-07', 'Male', 23, 13, 'Goalkeeper', 'active', ''),
('Jose Maria', 'Gimenez', 'josemaria.gimenez@seed.msms.local', '1995-01-20', 'Male', 23, 2, 'Defender', 'active', ''),
('Koke', 'Resurreccion', 'koke.resurreccion@seed.msms.local', '1992-01-08', 'Male', 23, 6, 'Midfielder', 'active', ''),
('Rodrigo', 'De Paul', 'rodrigo.depaul@seed.msms.local', '1994-05-24', 'Male', 23, 5, 'Midfielder', 'active', ''),
('Antoine', 'Griezmann', 'antoine.griezmann@seed.msms.local', '1991-03-21', 'Male', 23, 7, 'Forward', 'active', ''),
('Julian', 'Alvarez', 'julian.alvarez@seed.msms.local', '2000-01-31', 'Male', 23, 19, 'Forward', 'active', ''),
('Alexander', 'Sorloth', 'alexander.sorloth@seed.msms.local', '1995-12-05', 'Male', 23, 9, 'Forward', 'active', ''),

('Paulo', 'Gazzaniga', 'paulo.gazzaniga@seed.msms.local', '1992-01-02', 'Male', 24, 13, 'Goalkeeper', 'active', ''),
('Daley', 'Blind', 'daley.blind@seed.msms.local', '1990-03-09', 'Male', 24, 17, 'Defender', 'active', ''),
('Miguel', 'Gutierrez', 'miguel.gutierrez@seed.msms.local', '2001-07-27', 'Male', 24, 3, 'Defender', 'active', ''),
('Yangel', 'Herrera', 'yangel.herrera@seed.msms.local', '1998-01-07', 'Male', 24, 21, 'Midfielder', 'active', ''),
('Ivan', 'Martin', 'ivan.martin@seed.msms.local', '1999-02-14', 'Male', 24, 23, 'Midfielder', 'active', ''),
('Viktor', 'Tsygankov', 'viktor.tsygankov@seed.msms.local', '1997-11-15', 'Male', 24, 8, 'Forward', 'active', ''),
('Cristhian', 'Stuani', 'cristhian.stuani@seed.msms.local', '1986-10-12', 'Male', 24, 7, 'Forward', 'active', ''),

('Adrian', 'San Miguel', 'adrian.sanmiguel@seed.msms.local', '1987-01-03', 'Male', 25, 13, 'Goalkeeper', 'active', ''),
('Marc', 'Bartra', 'marc.bartra@seed.msms.local', '1991-01-15', 'Male', 25, 5, 'Defender', 'active', ''),
('Johnny', 'Cardoso', 'johnny.cardoso@seed.msms.local', '2001-09-20', 'Male', 25, 4, 'Midfielder', 'active', ''),
('Isco', 'Alarcon', 'isco.alarcon@seed.msms.local', '1992-04-21', 'Male', 25, 22, 'Midfielder', 'active', ''),
('Giovani', 'Lo Celso', 'giovani.locelso@seed.msms.local', '1996-04-09', 'Male', 25, 20, 'Midfielder', 'active', ''),
('Aitor', 'Ruibal', 'aitor.ruibal@seed.msms.local', '1996-03-22', 'Male', 25, 24, 'Forward', 'active', ''),
('Chimy', 'Avila', 'chimy.avila@seed.msms.local', '1994-02-06', 'Male', 25, 9, 'Forward', 'active', ''),

('Manuel', 'Neuer', 'manuel.neuer@seed.msms.local', '1986-03-27', 'Male', 26, 1, 'Goalkeeper', 'active', ''),
('Dayot', 'Upamecano', 'dayot.upamecano@seed.msms.local', '1998-10-27', 'Male', 26, 2, 'Defender', 'active', ''),
('Joshua', 'Kimmich', 'joshua.kimmich@seed.msms.local', '1995-02-08', 'Male', 26, 6, 'Midfielder', 'active', ''),
('Jamal', 'Musiala', 'jamal.musiala@seed.msms.local', '2003-02-26', 'Male', 26, 42, 'Midfielder', 'active', ''),
('Thomas', 'Muller', 'thomas.muller@seed.msms.local', '1989-09-13', 'Male', 26, 25, 'Forward', 'active', ''),
('Harry', 'Kane', 'harry.kane@seed.msms.local', '1993-07-28', 'Male', 26, 9, 'Forward', 'active', ''),
('Alphonso', 'Davies', 'alphonso.davies@seed.msms.local', '2000-11-02', 'Male', 26, 19, 'Defender', 'active', ''),

('Gregor', 'Kobel', 'gregor.kobel@seed.msms.local', '1997-12-06', 'Male', 27, 1, 'Goalkeeper', 'active', ''),
('Nico', 'Schlotterbeck', 'nico.schlotterbeck@seed.msms.local', '1999-12-01', 'Male', 27, 4, 'Defender', 'active', ''),
('Emre', 'Can', 'emre.can@seed.msms.local', '1994-01-12', 'Male', 27, 23, 'Midfielder', 'active', ''),
('Julian', 'Brandt', 'julian.brandt@seed.msms.local', '1996-05-02', 'Male', 27, 10, 'Midfielder', 'active', ''),
('Karim', 'Adeyemi', 'karim.adeyemi@seed.msms.local', '2002-01-18', 'Male', 27, 27, 'Forward', 'active', ''),
('Serhou', 'Guirassy', 'serhou.guirassy@seed.msms.local', '1996-03-12', 'Male', 27, 9, 'Forward', 'active', ''),
('Jamie', 'Bynoe-Gittens', 'jamie.bynoe-gittens@seed.msms.local', '2004-08-08', 'Male', 27, 43, 'Forward', 'active', ''),

('Lukas', 'Hradecky', 'lukas.hradecky@seed.msms.local', '1989-11-24', 'Male', 28, 1, 'Goalkeeper', 'active', ''),
('Jonathan', 'Tah', 'jonathan.tah@seed.msms.local', '1996-02-11', 'Male', 28, 4, 'Defender', 'active', ''),
('Granit', 'Xhaka', 'granit.xhaka@seed.msms.local', '1992-09-27', 'Male', 28, 34, 'Midfielder', 'active', ''),
('Jeremie', 'Frimpong', 'jeremie.frimpong@seed.msms.local', '2000-12-10', 'Male', 28, 30, 'Defender', 'active', ''),
('Florian', 'Wirtz', 'florian.wirtz@seed.msms.local', '2003-05-03', 'Male', 28, 10, 'Midfielder', 'active', ''),
('Alex', 'Grimaldo', 'alex.grimaldo@seed.msms.local', '1995-09-20', 'Male', 28, 20, 'Defender', 'active', ''),
('Patrik', 'Schick', 'patrik.schick@seed.msms.local', '1996-01-24', 'Male', 28, 14, 'Forward', 'active', ''),

('Peter', 'Gulacsi', 'peter.gulacsi@seed.msms.local', '1990-05-06', 'Male', 29, 1, 'Goalkeeper', 'active', ''),
('Willi', 'Orban', 'willi.orban@seed.msms.local', '1992-11-03', 'Male', 29, 4, 'Defender', 'active', ''),
('David', 'Raum', 'david.raum@seed.msms.local', '1998-04-22', 'Male', 29, 22, 'Defender', 'active', ''),
('Amadou', 'Haidara', 'amadou.haidara@seed.msms.local', '1998-01-31', 'Male', 29, 8, 'Midfielder', 'active', ''),
('Xavi', 'Simons', 'xavi.simons@seed.msms.local', '2003-04-21', 'Male', 29, 10, 'Midfielder', 'active', ''),
('Lois', 'Openda', 'lois.openda@seed.msms.local', '2000-02-16', 'Male', 29, 11, 'Forward', 'active', ''),
('Benjamin', 'Sesko', 'benjamin.sesko@seed.msms.local', '2003-05-31', 'Male', 29, 30, 'Forward', 'active', ''),

('Alexander', 'Nubel', 'alexander.nubel@seed.msms.local', '1996-09-30', 'Male', 30, 33, 'Goalkeeper', 'active', ''),
('Maximilian', 'Mittelstadt', 'maximilian.mittelstadt@seed.msms.local', '1997-03-18', 'Male', 30, 7, 'Defender', 'active', ''),
('Atakan', 'Karazor', 'atakan.karazor@seed.msms.local', '1996-10-13', 'Male', 30, 16, 'Midfielder', 'active', ''),
('Angelo', 'Stiller', 'angelo.stiller@seed.msms.local', '2001-04-04', 'Male', 30, 6, 'Midfielder', 'active', ''),
('Enzo', 'Millot', 'enzo.millot@seed.msms.local', '2002-07-17', 'Male', 30, 8, 'Midfielder', 'active', ''),
('Chris', 'Fuhrich', 'chris.fuhrich@seed.msms.local', '1998-01-09', 'Male', 30, 27, 'Forward', 'active', ''),
('Deniz', 'Undav', 'deniz.undav@seed.msms.local', '1996-07-19', 'Male', 30, 26, 'Forward', 'active', '');

INSERT INTO players (first_name, last_name, email, date_of_birth, gender, team_id, jersey_number, position, status, player_image_url) VALUES
('Novak', 'Djokovic', 'novak.djokovic@seed.msms.local', '1987-05-22', 'Male', 31, 1, 'Singles Player', 'active', ''),
('Carlos', 'Alcaraz', 'carlos.alcaraz@seed.msms.local', '2003-05-05', 'Male', 32, 1, 'Singles Player', 'active', ''),
('Jannik', 'Sinner', 'jannik.sinner@seed.msms.local', '2001-08-16', 'Male', 33, 1, 'Singles Player', 'active', ''),
('Iga', 'Swiatek', 'iga.swiatek@seed.msms.local', '2001-05-31', 'Female', 34, 1, 'Singles Player', 'active', ''),
('Coco', 'Gauff', 'coco.gauff@seed.msms.local', '2004-03-13', 'Female', 35, 1, 'Singles Player', 'active', ''),
('Lakshya', 'Sen', 'lakshya.sen@seed.msms.local', '2001-08-16', 'Male', 36, 1, 'Singles Player', 'active', ''),
('Anders', 'Antonsen', 'anders.antonsen@seed.msms.local', '1997-04-27', 'Male', 37, 1, 'Singles Player', 'active', ''),
('Anthony', 'Ginting', 'anthony.ginting@seed.msms.local', '1996-10-20', 'Male', 38, 1, 'Singles Player', 'active', ''),
('Shi', 'Yuqi', 'shi.yuqi@seed.msms.local', '1996-02-28', 'Male', 39, 1, 'Singles Player', 'active', ''),
('An', 'Se-young', 'an.seyoung@seed.msms.local', '2002-02-05', 'Female', 40, 1, 'Singles Player', 'active', '');

-- ============================================================
-- EVENTS AND TEAM REGISTRATION
-- ============================================================
INSERT INTO events (name, sport_id, event_type, format, start_date, end_date, status, description, event_image_url) VALUES
('Indian Premier League 2026', 1, 'league', 'round-robin', '2026-03-20', '2026-05-26', 'ongoing', 'Franchise T20 league featuring all ten IPL teams.', 'https://r2.thesportsdb.com/images/media/league/badge/gaiti11741709844.png/medium'),
('ICC Men''s T20 World Cup 2026', 1, 'tournament', 'group+knockout', '2026-06-04', '2026-06-30', 'upcoming', 'International T20 world championship featuring leading cricket nations.', 'https://r2.thesportsdb.com/images/media/league/badge/jc2g4c1651173316.png/medium'),
('Premier League 2025-26', 2, 'league', 'round-robin', '2025-08-15', '2026-05-24', 'ongoing', 'England''s top-flight league season.', 'https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png/medium'),
('LaLiga 2025-26', 2, 'league', 'round-robin', '2025-08-16', '2026-05-24', 'ongoing', 'Spain''s top-flight league season.', 'https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png/medium'),
('Bundesliga 2025-26', 2, 'league', 'round-robin', '2025-08-22', '2026-05-16', 'ongoing', 'Germany''s top-flight league season.', 'https://r2.thesportsdb.com/images/media/league/badge/teqh1b1679952008.png/medium'),
('UEFA Champions League 2025-26', 2, 'tournament', 'group+knockout', '2025-09-16', '2026-05-30', 'ongoing', 'Europe''s premier club competition.', 'https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png/medium'),
('ATP National Showcase 2026', 3, 'championship', 'group+knockout', '2026-04-05', '2026-04-20', 'ongoing', 'Compact showcase featuring five elite tennis stars through national teams.', 'https://r2.thesportsdb.com/images/media/league/badge/q7aej51769857150.png/medium'),
('BWF National Showcase 2026', 4, 'championship', 'group+knockout', '2026-04-07', '2026-04-21', 'ongoing', 'Compact showcase featuring five elite badminton stars through national teams.', 'https://upload.wikimedia.org/wikipedia/en/1/19/BWF_World_Tour_Finals.png');

INSERT INTO event_teams (event_id, team_id, seed_rank) VALUES
(1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5), (1, 6, 6), (1, 7, 7), (1, 8, 8), (1, 9, 9), (1, 10, 10),
(2, 11, 1), (2, 12, 2), (2, 13, 3), (2, 14, 4), (2, 15, 5),
(3, 16, 1), (3, 17, 2), (3, 18, 3), (3, 19, 4), (3, 20, 5),
(4, 21, 1), (4, 22, 2), (4, 23, 3), (4, 24, 4), (4, 25, 5),
(5, 26, 1), (5, 27, 2), (5, 28, 3), (5, 29, 4), (5, 30, 5),
(6, 16, 1), (6, 18, 2), (6, 20, 3), (6, 21, 4), (6, 22, 5), (6, 23, 6), (6, 26, 7), (6, 27, 8),
(7, 31, 1), (7, 32, 2), (7, 33, 3), (7, 34, 4), (7, 35, 5),
(8, 36, 1), (8, 37, 2), (8, 38, 3), (8, 39, 4), (8, 40, 5);
-- ============================================================
-- PLAYERS
-- Cricket club players (IPL)
-- ============================================================
INSERT INTO players (first_name, last_name, email, date_of_birth, gender, team_id, jersey_number, position, status) VALUES
('Rohit', 'Sharma', 'rohit.sharma@seed.msms.local', '1987-04-30', 'Male', 1, 45, 'Batsman', 'active'),
('Suryakumar', 'Yadav', 'suryakumar.yadav@seed.msms.local', '1990-09-14', 'Male', 1, 63, 'Batsman', 'active'),
('Hardik', 'Pandya', 'hardik.pandya@seed.msms.local', '1993-10-11', 'Male', 1, 33, 'All-Rounder', 'active'),
('Jasprit', 'Bumrah', 'jasprit.bumrah@seed.msms.local', '1993-12-06', 'Male', 1, 93, 'Bowler', 'active'),
('Tilak', 'Varma', 'tilak.varma@seed.msms.local', '2002-11-08', 'Male', 1, 9, 'Batsman', 'active'),
('Trent', 'Boult', 'trent.boult@seed.msms.local', '1989-07-22', 'Male', 1, 18, 'Bowler', 'active'),
('Ryan', 'Rickelton', 'ryan.rickelton@seed.msms.local', '1996-07-11', 'Male', 1, 44, 'Wicket-Keeper', 'active'),

('Ruturaj', 'Gaikwad', 'ruturaj.gaikwad@seed.msms.local', '1997-01-31', 'Male', 2, 31, 'Batsman', 'active'),
('Devon', 'Conway', 'devon.conway@seed.msms.local', '1991-07-08', 'Male', 2, 88, 'Wicket-Keeper', 'active'),
('Ravindra', 'Jadeja', 'ravindra.jadeja@seed.msms.local', '1988-12-06', 'Male', 2, 8, 'All-Rounder', 'active'),
('MS', 'Dhoni', 'ms.dhoni@seed.msms.local', '1981-07-07', 'Male', 2, 7, 'Wicket-Keeper', 'active'),
('Shivam', 'Dube', 'shivam.dube@seed.msms.local', '1993-06-26', 'Male', 2, 25, 'All-Rounder', 'active'),
('Noor', 'Ahmad', 'noor.ahmad@seed.msms.local', '2005-01-03', 'Male', 2, 10, 'Bowler', 'active'),
('Ravichandran', 'Ashwin', 'ravichandran.ashwin@seed.msms.local', '1986-09-17', 'Male', 2, 99, 'Bowler', 'active'),

('Virat', 'Kohli', 'virat.kohli@seed.msms.local', '1988-11-05', 'Male', 3, 18, 'Batsman', 'active'),
('Rajat', 'Patidar', 'rajat.patidar@seed.msms.local', '1993-06-01', 'Male', 3, 97, 'Batsman', 'active'),
('Phil', 'Salt', 'phil.salt@seed.msms.local', '1996-08-28', 'Male', 3, 28, 'Wicket-Keeper', 'active'),
('Liam', 'Livingstone', 'liam.livingstone@seed.msms.local', '1993-08-04', 'Male', 3, 23, 'All-Rounder', 'active'),
('Krunal', 'Pandya', 'krunal.pandya@seed.msms.local', '1991-03-24', 'Male', 3, 24, 'All-Rounder', 'active'),
('Josh', 'Hazlewood', 'josh.hazlewood@seed.msms.local', '1991-01-08', 'Male', 3, 38, 'Bowler', 'active'),
('Bhuvneshwar', 'Kumar', 'bhuvneshwar.kumar@seed.msms.local', '1990-02-05', 'Male', 3, 15, 'Bowler', 'active'),

('Ajinkya', 'Rahane', 'ajinkya.rahane@seed.msms.local', '1988-06-06', 'Male', 4, 3, 'Batsman', 'active'),
('Sunil', 'Narine', 'sunil.narine@seed.msms.local', '1988-05-26', 'Male', 4, 74, 'All-Rounder', 'active'),
('Andre', 'Russell', 'andre.russell@seed.msms.local', '1988-04-29', 'Male', 4, 12, 'All-Rounder', 'active'),
('Rinku', 'Singh', 'rinku.singh@seed.msms.local', '1997-10-12', 'Male', 4, 35, 'Batsman', 'active'),
('Varun', 'Chakravarthy', 'varun.chakravarthy@seed.msms.local', '1991-08-29', 'Male', 4, 29, 'Bowler', 'active'),
('Quinton', 'de Kock', 'quinton.dekock@seed.msms.local', '1992-12-17', 'Male', 4, 47, 'Wicket-Keeper', 'active'),
('Harshit', 'Rana', 'harshit.rana@seed.msms.local', '2001-12-22', 'Male', 4, 22, 'Bowler', 'active'),

('Travis', 'Head', 'travis.head@seed.msms.local', '1993-12-29', 'Male', 5, 62, 'Batsman', 'active'),
('Abhishek', 'Sharma', 'abhishek.sharma@seed.msms.local', '2000-09-04', 'Male', 5, 4, 'All-Rounder', 'active'),
('Heinrich', 'Klaasen', 'heinrich.klaasen@seed.msms.local', '1991-07-30', 'Male', 5, 45, 'Wicket-Keeper', 'active'),
('Pat', 'Cummins', 'pat.cummins@seed.msms.local', '1993-05-08', 'Male', 5, 30, 'Bowler', 'active'),
('Mohammed', 'Shami', 'mohammed.shami@seed.msms.local', '1990-09-03', 'Male', 5, 11, 'Bowler', 'active'),
('Nitish', 'Reddy', 'nitish.reddy@seed.msms.local', '2003-05-26', 'Male', 5, 8, 'All-Rounder', 'active'),
('Ishan', 'Kishan', 'ishan.kishan@seed.msms.local', '1998-07-18', 'Male', 5, 32, 'Wicket-Keeper', 'active'),

('Sanju', 'Samson', 'sanju.samson@seed.msms.local', '1994-11-11', 'Male', 6, 11, 'Wicket-Keeper', 'active'),
('Yashasvi', 'Jaiswal', 'yashasvi.jaiswal@seed.msms.local', '2001-12-28', 'Male', 6, 64, 'Batsman', 'active'),
('Riyan', 'Parag', 'riyan.parag@seed.msms.local', '2001-11-10', 'Male', 6, 3, 'All-Rounder', 'active'),
('Dhruv', 'Jurel', 'dhruv.jurel@seed.msms.local', '2001-01-21', 'Male', 6, 21, 'Wicket-Keeper', 'active'),
('Jofra', 'Archer', 'jofra.archer@seed.msms.local', '1995-04-01', 'Male', 6, 22, 'Bowler', 'active'),
('Wanindu', 'Hasaranga', 'wanindu.hasaranga@seed.msms.local', '1997-07-29', 'Male', 6, 49, 'All-Rounder', 'active'),
('Sandeep', 'Sharma', 'sandeep.sharma@seed.msms.local', '1993-05-18', 'Male', 6, 66, 'Bowler', 'active'),

('KL', 'Rahul', 'kl.rahul@seed.msms.local', '1992-04-18', 'Male', 7, 1, 'Wicket-Keeper', 'active'),
('Axar', 'Patel', 'axar.patel@seed.msms.local', '1994-01-20', 'Male', 7, 20, 'All-Rounder', 'active'),
('Kuldeep', 'Yadav', 'kuldeep.yadav@seed.msms.local', '1994-12-14', 'Male', 7, 23, 'Bowler', 'active'),
('Mitchell', 'Starc', 'mitchell.starc@seed.msms.local', '1990-01-30', 'Male', 7, 56, 'Bowler', 'active'),
('Tristan', 'Stubbs', 'tristan.stubbs@seed.msms.local', '2000-08-14', 'Male', 7, 30, 'Batsman', 'active'),
('Faf', 'du Plessis', 'faf.duplessis@seed.msms.local', '1984-07-13', 'Male', 7, 18, 'Batsman', 'active'),
('Jake', 'Fraser-McGurk', 'jake.fraser-mcgurk@seed.msms.local', '2002-04-11', 'Male', 7, 17, 'Batsman', 'active'),

('Shreyas', 'Iyer', 'shreyas.iyer@seed.msms.local', '1994-12-06', 'Male', 8, 41, 'Batsman', 'active'),
('Arshdeep', 'Singh', 'arshdeep.singh@seed.msms.local', '1999-02-05', 'Male', 8, 2, 'Bowler', 'active'),
('Yuzvendra', 'Chahal', 'yuzvendra.chahal@seed.msms.local', '1990-07-23', 'Male', 8, 3, 'Bowler', 'active'),
('Marcus', 'Stoinis', 'marcus.stoinis@seed.msms.local', '1989-08-16', 'Male', 8, 17, 'All-Rounder', 'active'),
('Glenn', 'Maxwell', 'glenn.maxwell@seed.msms.local', '1988-10-14', 'Male', 8, 32, 'All-Rounder', 'active'),
('Prabhsimran', 'Singh', 'prabhsimran.singh@seed.msms.local', '2000-08-10', 'Male', 8, 84, 'Wicket-Keeper', 'active'),
('Marco', 'Jansen', 'marco.jansen@seed.msms.local', '2000-05-01', 'Male', 8, 70, 'All-Rounder', 'active'),

('Shubman', 'Gill', 'shubman.gill@seed.msms.local', '1999-09-08', 'Male', 9, 77, 'Batsman', 'active'),
('Rashid', 'Khan', 'rashid.khan@seed.msms.local', '1998-09-20', 'Male', 9, 19, 'Bowler', 'active'),
('Sai', 'Sudharsan', 'sai.sudharsan@seed.msms.local', '2001-10-15', 'Male', 9, 66, 'Batsman', 'active'),
('Jos', 'Buttler', 'jos.buttler@seed.msms.local', '1990-09-08', 'Male', 9, 63, 'Wicket-Keeper', 'active'),
('Mohammed', 'Siraj', 'mohammed.siraj@seed.msms.local', '1994-03-13', 'Male', 9, 13, 'Bowler', 'active'),
('Rahul', 'Tewatia', 'rahul.tewatia@seed.msms.local', '1993-05-20', 'Male', 9, 9, 'All-Rounder', 'active'),
('Kagiso', 'Rabada', 'kagiso.rabada@seed.msms.local', '1995-05-25', 'Male', 9, 25, 'Bowler', 'active'),

('Rishabh', 'Pant', 'rishabh.pant@seed.msms.local', '1997-10-04', 'Male', 10, 17, 'Wicket-Keeper', 'active'),
('Nicholas', 'Pooran', 'nicholas.pooran@seed.msms.local', '1995-10-02', 'Male', 10, 29, 'Wicket-Keeper', 'active'),
('Mitchell', 'Marsh', 'mitchell.marsh@seed.msms.local', '1991-10-20', 'Male', 10, 8, 'All-Rounder', 'active'),
('Aiden', 'Markram', 'aiden.markram@seed.msms.local', '1994-10-04', 'Male', 10, 4, 'All-Rounder', 'active'),
('Ravi', 'Bishnoi', 'ravi.bishnoi@seed.msms.local', '2000-09-05', 'Male', 10, 56, 'Bowler', 'active'),
('Avesh', 'Khan', 'avesh.khan@seed.msms.local', '1996-12-13', 'Male', 10, 65, 'Bowler', 'active'),
('David', 'Miller', 'david.miller@seed.msms.local', '1989-06-10', 'Male', 10, 10, 'Batsman', 'active');

INSERT INTO players (first_name, last_name, email, date_of_birth, gender, team_id, jersey_number, position, status) VALUES
('Adil', 'Rashid', 'adil.rashid@seed.msms.local', '1988-02-17', 'Male', 13, 95, 'Bowler', 'active'),
('Babar', 'Azam', 'babar.azam@seed.msms.local', '1994-10-15', 'Male', 14, 56, 'Batsman', 'active'),
('Mohammad', 'Rizwan', 'mohammad.rizwan@seed.msms.local', '1992-06-01', 'Male', 14, 16, 'Wicket-Keeper', 'active'),
('Shaheen', 'Afridi', 'shaheen.afridi@seed.msms.local', '2000-04-06', 'Male', 14, 10, 'Bowler', 'active'),
('Haris', 'Rauf', 'haris.rauf@seed.msms.local', '1993-11-07', 'Male', 14, 97, 'Bowler', 'active'),
('Shadab', 'Khan', 'shadab.khan@seed.msms.local', '1998-10-04', 'Male', 14, 7, 'All-Rounder', 'active');

-- ============================================================
-- EXTRA MEMBERSHIPS
-- Add country-team links for shared cricket players.
-- Club memberships are auto-created later from players.team_id.
-- ============================================================
INSERT INTO player_team_memberships (player_id, team_id, jersey_number, position, membership_type, is_active, start_date, notes) VALUES
((SELECT player_id FROM players WHERE email = 'rohit.sharma@seed.msms.local'), 11, 45, 'Batsman', 'country', 1, '2024-01-01', 'India T20 core group'),
((SELECT player_id FROM players WHERE email = 'virat.kohli@seed.msms.local'), 11, 18, 'Batsman', 'country', 1, '2024-01-01', 'India T20 core group'),
((SELECT player_id FROM players WHERE email = 'suryakumar.yadav@seed.msms.local'), 11, 63, 'Batsman', 'country', 1, '2024-01-01', 'India T20 core group'),
((SELECT player_id FROM players WHERE email = 'hardik.pandya@seed.msms.local'), 11, 33, 'All-Rounder', 'country', 1, '2024-01-01', 'India T20 core group'),
((SELECT player_id FROM players WHERE email = 'jasprit.bumrah@seed.msms.local'), 11, 93, 'Bowler', 'country', 1, '2024-01-01', 'India T20 core group'),
((SELECT player_id FROM players WHERE email = 'travis.head@seed.msms.local'), 12, 62, 'Batsman', 'country', 1, '2024-01-01', 'Australia T20 core group'),
((SELECT player_id FROM players WHERE email = 'pat.cummins@seed.msms.local'), 12, 30, 'Bowler', 'country', 1, '2024-01-01', 'Australia T20 core group'),
((SELECT player_id FROM players WHERE email = 'mitchell.starc@seed.msms.local'), 12, 56, 'Bowler', 'country', 1, '2024-01-01', 'Australia T20 core group'),
((SELECT player_id FROM players WHERE email = 'glenn.maxwell@seed.msms.local'), 12, 32, 'All-Rounder', 'country', 1, '2024-01-01', 'Australia T20 core group'),
((SELECT player_id FROM players WHERE email = 'marcus.stoinis@seed.msms.local'), 12, 17, 'All-Rounder', 'country', 1, '2024-01-01', 'Australia T20 core group'),
((SELECT player_id FROM players WHERE email = 'jos.buttler@seed.msms.local'), 13, 63, 'Wicket-Keeper', 'country', 1, '2024-01-01', 'England T20 core group'),
((SELECT player_id FROM players WHERE email = 'phil.salt@seed.msms.local'), 13, 28, 'Wicket-Keeper', 'country', 1, '2024-01-01', 'England T20 core group'),
((SELECT player_id FROM players WHERE email = 'liam.livingstone@seed.msms.local'), 13, 23, 'All-Rounder', 'country', 1, '2024-01-01', 'England T20 core group'),
((SELECT player_id FROM players WHERE email = 'jofra.archer@seed.msms.local'), 13, 22, 'Bowler', 'country', 1, '2024-01-01', 'England T20 core group'),
((SELECT player_id FROM players WHERE email = 'heinrich.klaasen@seed.msms.local'), 15, 45, 'Wicket-Keeper', 'country', 1, '2024-01-01', 'South Africa T20 core group'),
((SELECT player_id FROM players WHERE email = 'kagiso.rabada@seed.msms.local'), 15, 25, 'Bowler', 'country', 1, '2024-01-01', 'South Africa T20 core group'),
((SELECT player_id FROM players WHERE email = 'marco.jansen@seed.msms.local'), 15, 70, 'All-Rounder', 'country', 1, '2024-01-01', 'South Africa T20 core group'),
((SELECT player_id FROM players WHERE email = 'tristan.stubbs@seed.msms.local'), 15, 30, 'Batsman', 'country', 1, '2024-01-01', 'South Africa T20 core group'),
((SELECT player_id FROM players WHERE email = 'aiden.markram@seed.msms.local'), 15, 4, 'All-Rounder', 'country', 1, '2024-01-01', 'South Africa T20 core group');

-- ============================================================
-- MATCHES, SCHEDULES, EVENTS, STATS, AND ROSTERS
-- Match ids are assigned in insert order below.
-- ============================================================
INSERT INTO matches (event_id, venue_id, match_date, status, round_name, result_summary) VALUES
(3, 15, '2026-04-06 20:00:00', 'completed', 'Matchweek 31', 'Liverpool won 2-1'),
(4, 20, '2026-04-07 21:00:00', 'completed', 'Matchweek 30', 'Real Madrid won 3-2'),
(5, 25, '2026-04-05 18:30:00', 'completed', 'Matchday 28', 'Bayern Munich drew 1-1 with Bayer Leverkusen'),
(6, 19, '2026-04-09 20:45:00', 'completed', 'Quarter-final', 'Arsenal won 2-0'),
(1, 1, '2026-03-29 19:30:00', 'completed', 'League Stage', 'Mumbai Indians won by 13 runs'),
(1, 3, '2026-04-15 19:30:00', 'scheduled', 'League Stage', NULL),
(2, 9, '2026-06-08 19:30:00', 'completed', 'Group Stage', 'India won by 7 runs'),
(7, 30, '2026-04-08 17:00:00', 'completed', 'Semifinal', 'Serbia won 2-1 in sets'),
(7, 32, '2026-04-13 17:00:00', 'scheduled', 'Semifinal', NULL),
(8, 35, '2026-04-09 18:30:00', 'completed', 'Semifinal', 'India Badminton won 2-1 in games'),
(8, 37, '2026-04-14 18:30:00', 'scheduled', 'Semifinal', NULL);

INSERT INTO match_teams (match_id, team_id, score, is_winner, innings_1_score, innings_2_score, sets_won) VALUES
(1, 16, 2, 1, NULL, NULL, NULL), (1, 20, 1, 0, NULL, NULL, NULL),
(2, 21, 3, 1, NULL, NULL, NULL), (2, 22, 2, 0, NULL, NULL, NULL),
(3, 26, 1, 0, NULL, NULL, NULL), (3, 28, 1, 0, NULL, NULL, NULL),
(4, 20, 2, 1, NULL, NULL, NULL), (4, 21, 0, 0, NULL, NULL, NULL),
(5, 1, 187, 1, 187, NULL, NULL), (5, 2, 174, 0, 174, NULL, NULL),
(6, 3, 0, 0, NULL, NULL, NULL), (6, 4, 0, 0, NULL, NULL, NULL),
(7, 11, 168, 1, 168, NULL, NULL), (7, 12, 161, 0, 161, NULL, NULL),
(8, 31, 2, 1, NULL, NULL, 2), (8, 32, 1, 0, NULL, NULL, 1),
(9, 33, 0, 0, NULL, NULL, NULL), (9, 34, 0, 0, NULL, NULL, NULL),
(10, 36, 2, 1, NULL, NULL, 2), (10, 37, 1, 0, NULL, NULL, 1),
(11, 38, 0, 0, NULL, NULL, NULL), (11, 39, 0, 0, NULL, NULL, NULL);

INSERT INTO schedules (match_id, scheduled_time, actual_start_time, actual_end_time, notes) VALUES
(1, '2026-04-06 20:00:00', '2026-04-06 20:01:00', '2026-04-06 21:54:00', 'Liverpool held on after a strong first hour'),
(2, '2026-04-07 21:00:00', '2026-04-07 21:03:00', '2026-04-07 22:57:00', 'High-tempo Clasico style fixture'),
(3, '2026-04-05 18:30:00', '2026-04-05 18:31:00', '2026-04-05 20:23:00', 'Balanced tactical battle'),
(4, '2026-04-09 20:45:00', '2026-04-09 20:46:00', '2026-04-09 22:39:00', 'Arsenal controlled the second half'),
(5, '2026-03-29 19:30:00', '2026-03-29 19:33:00', '2026-03-29 23:02:00', 'Strong death bowling from Mumbai'),
(6, '2026-04-15 19:30:00', NULL, NULL, 'RCB host KKR in a marquee IPL fixture'),
(7, '2026-06-08 19:30:00', '2026-06-08 19:32:00', '2026-06-08 22:51:00', 'Group-stage night match'),
(8, '2026-04-08 17:00:00', '2026-04-08 17:04:00', '2026-04-08 19:12:00', 'Three-set contest between elite singles stars'),
(9, '2026-04-13 17:00:00', NULL, NULL, 'Italy faces Poland in the second semifinal'),
(10, '2026-04-09 18:30:00', '2026-04-09 18:33:00', '2026-04-09 19:41:00', 'Fast, attacking singles match'),
(11, '2026-04-14 18:30:00', NULL, NULL, 'Indonesia meets China in the second semifinal');

INSERT INTO match_events (match_id, team_id, player_id, secondary_player_id, event_type, minute_or_over, detail) VALUES
(1, 16, (SELECT player_id FROM players WHERE email = 'mohamed.salah@seed.msms.local'), (SELECT player_id FROM players WHERE email = 'dominik.szoboszlai@seed.msms.local'), 'goal', 18, 'Left-foot finish after a cutback'),
(1, 16, (SELECT player_id FROM players WHERE email = 'luis.diaz@seed.msms.local'), (SELECT player_id FROM players WHERE email = 'alexis.macallister@seed.msms.local'), 'goal', 52, 'Low finish across the goalkeeper'),
(1, 20, (SELECT player_id FROM players WHERE email = 'bukayo.saka@seed.msms.local'), NULL, 'goal', 76, 'Shot tucked inside the near post'),
(1, 20, (SELECT player_id FROM players WHERE email = 'declan.rice@seed.msms.local'), NULL, 'yellow_card', 81, 'Late midfield challenge'),
(2, 21, (SELECT player_id FROM players WHERE email = 'kylian.mbappe@seed.msms.local'), (SELECT player_id FROM players WHERE email = 'jude.bellingham@seed.msms.local'), 'goal', 11, 'Fast break finished from close range'),
(2, 22, (SELECT player_id FROM players WHERE email = 'robert.lewandowski@seed.msms.local'), NULL, 'goal', 24, 'Poacher finish inside the six-yard box'),
(2, 21, (SELECT player_id FROM players WHERE email = 'jude.bellingham@seed.msms.local'), NULL, 'goal', 61, 'Late run into the box and composed finish'),
(2, 22, (SELECT player_id FROM players WHERE email = 'lamine.yamal@seed.msms.local'), (SELECT player_id FROM players WHERE email = 'pedri.gonzalez@seed.msms.local'), 'goal', 73, 'Curled effort from the right side'),
(2, 21, (SELECT player_id FROM players WHERE email = 'kylian.mbappe@seed.msms.local'), NULL, 'goal', 84, 'Clinical winner on the counter'),
(3, 26, (SELECT player_id FROM players WHERE email = 'harry.kane@seed.msms.local'), NULL, 'goal', 39, 'Penalty converted calmly'),
(3, 28, (SELECT player_id FROM players WHERE email = 'florian.wirtz@seed.msms.local'), (SELECT player_id FROM players WHERE email = 'jeremie.frimpong@seed.msms.local'), 'goal', 67, 'Right-foot finish from the edge of the box'),
(4, 20, (SELECT player_id FROM players WHERE email = 'bukayo.saka@seed.msms.local'), (SELECT player_id FROM players WHERE email = 'martin.odegaard@seed.msms.local'), 'goal', 28, 'One-touch finish from a through ball'),
(4, 20, (SELECT player_id FROM players WHERE email = 'kai.havertz@seed.msms.local'), (SELECT player_id FROM players WHERE email = 'bukayo.saka@seed.msms.local'), 'goal', 71, 'Header from a clipped cross'),
(8, 31, (SELECT player_id FROM players WHERE email = 'novak.djokovic@seed.msms.local'), NULL, 'set_won', NULL, 'Won opening set 6-4'),
(8, 32, (SELECT player_id FROM players WHERE email = 'carlos.alcaraz@seed.msms.local'), NULL, 'set_won', NULL, 'Took second set 7-5'),
(8, 31, (SELECT player_id FROM players WHERE email = 'novak.djokovic@seed.msms.local'), NULL, 'set_won', NULL, 'Won decider 6-3'),
(10, 36, (SELECT player_id FROM players WHERE email = 'lakshya.sen@seed.msms.local'), NULL, 'set_won', NULL, 'Won first game 21-18'),
(10, 37, (SELECT player_id FROM players WHERE email = 'anders.antonsen@seed.msms.local'), NULL, 'set_won', NULL, 'Took second game 21-16'),
(10, 36, (SELECT player_id FROM players WHERE email = 'lakshya.sen@seed.msms.local'), NULL, 'set_won', NULL, 'Closed the match 21-17');

INSERT INTO match_events (match_id, team_id, player_id, event_type, minute_or_over, ball_in_over, runs_scored, detail) VALUES
(5, 1, (SELECT player_id FROM players WHERE email = 'rohit.sharma@seed.msms.local'), 'run', 1, 1, 4, 'Pull shot to the boundary'),
(5, 1, (SELECT player_id FROM players WHERE email = 'suryakumar.yadav@seed.msms.local'), 'boundary_6', 4, 3, 6, 'Inside-out six over extra cover'),
(5, 1, (SELECT player_id FROM players WHERE email = 'hardik.pandya@seed.msms.local'), 'run', 18, 5, 6, 'Straight six at the death'),
(5, 2, (SELECT player_id FROM players WHERE email = 'ruturaj.gaikwad@seed.msms.local'), 'run', 2, 4, 4, 'Punched through point'),
(5, 2, (SELECT player_id FROM players WHERE email = 'shivam.dube@seed.msms.local'), 'boundary_6', 15, 2, 6, 'Flat six over midwicket'),
(5, 1, (SELECT player_id FROM players WHERE email = 'jasprit.bumrah@seed.msms.local'), 'wicket', 19, 4, 0, 'Yorker crashes into off stump'),
(7, 11, (SELECT player_id FROM players WHERE email = 'suryakumar.yadav@seed.msms.local'), 'run', 8, 6, 4, 'Late cut for four'),
(7, 11, (SELECT player_id FROM players WHERE email = 'hardik.pandya@seed.msms.local'), 'boundary_6', 17, 2, 6, 'Powerful finish over long-on'),
(7, 12, (SELECT player_id FROM players WHERE email = 'travis.head@seed.msms.local'), 'run', 3, 2, 4, 'Square drive on the rise'),
(7, 12, (SELECT player_id FROM players WHERE email = 'marcus.stoinis@seed.msms.local'), 'run', 16, 5, 6, 'Muscle through midwicket'),
(7, 11, (SELECT player_id FROM players WHERE email = 'jasprit.bumrah@seed.msms.local'), 'wicket', 20, 1, 0, 'Slower ball induces top edge');

INSERT INTO player_match_stats (player_id, match_id, goals_scored, assists, yellow_cards, minutes_played, rating, notes) VALUES
((SELECT player_id FROM players WHERE email = 'mohamed.salah@seed.msms.local'), 1, 1, 0, 0, 90, 8.4, 'Opened the scoring and remained dangerous throughout'),
((SELECT player_id FROM players WHERE email = 'luis.diaz@seed.msms.local'), 1, 1, 0, 0, 84, 8.0, 'Excellent direct running from the left'),
((SELECT player_id FROM players WHERE email = 'bukayo.saka@seed.msms.local'), 1, 1, 0, 0, 90, 7.8, 'Kept Arsenal alive with a quality finish'),
((SELECT player_id FROM players WHERE email = 'declan.rice@seed.msms.local'), 1, 0, 0, 1, 90, 6.9, 'Strong duels but booked late')
ON CONFLICT(player_id, match_id) DO UPDATE SET goals_scored=excluded.goals_scored, assists=excluded.assists, yellow_cards=excluded.yellow_cards, minutes_played=excluded.minutes_played, rating=excluded.rating, notes=excluded.notes;

INSERT INTO player_match_stats (player_id, match_id, goals_scored, assists, yellow_cards, minutes_played, rating, notes) VALUES
((SELECT player_id FROM players WHERE email = 'kylian.mbappe@seed.msms.local'), 2, 2, 0, 0, 90, 9.1, 'Decisive in transition and clinical with both finishes'),
((SELECT player_id FROM players WHERE email = 'jude.bellingham@seed.msms.local'), 2, 1, 1, 0, 90, 8.7, 'Drove Madrid forward from midfield'),
((SELECT player_id FROM players WHERE email = 'robert.lewandowski@seed.msms.local'), 2, 1, 0, 0, 90, 7.7, 'Sharp movement in the box'),
((SELECT player_id FROM players WHERE email = 'lamine.yamal@seed.msms.local'), 2, 1, 0, 0, 88, 7.8, 'Created danger every time he isolated his marker')
ON CONFLICT(player_id, match_id) DO UPDATE SET goals_scored=excluded.goals_scored, assists=excluded.assists, yellow_cards=excluded.yellow_cards, minutes_played=excluded.minutes_played, rating=excluded.rating, notes=excluded.notes;

INSERT INTO player_match_stats (player_id, match_id, goals_scored, assists, minutes_played, rating, notes) VALUES
((SELECT player_id FROM players WHERE email = 'harry.kane@seed.msms.local'), 3, 1, 0, 90, 8.0, 'Converted his penalty and linked play well'),
((SELECT player_id FROM players WHERE email = 'florian.wirtz@seed.msms.local'), 3, 1, 0, 90, 8.4, 'Equalized with a composed second-half finish'),
((SELECT player_id FROM players WHERE email = 'granit.xhaka@seed.msms.local'), 3, 0, 0, 90, 7.5, 'Controlled long phases of possession')
ON CONFLICT(player_id, match_id) DO UPDATE SET goals_scored=excluded.goals_scored, assists=excluded.assists, minutes_played=excluded.minutes_played, rating=excluded.rating, notes=excluded.notes;

INSERT INTO player_match_stats (player_id, match_id, goals_scored, assists, minutes_played, rating, notes) VALUES
((SELECT player_id FROM players WHERE email = 'bukayo.saka@seed.msms.local'), 4, 1, 1, 89, 9.0, 'Best player on the pitch with a goal and assist'),
((SELECT player_id FROM players WHERE email = 'kai.havertz@seed.msms.local'), 4, 1, 0, 86, 8.2, 'Dominant in the air and pressed effectively'),
((SELECT player_id FROM players WHERE email = 'martin.odegaard@seed.msms.local'), 4, 0, 1, 90, 8.0, 'Orchestrated Arsenal''s attacks')
ON CONFLICT(player_id, match_id) DO UPDATE SET goals_scored=excluded.goals_scored, assists=excluded.assists, minutes_played=excluded.minutes_played, rating=excluded.rating, notes=excluded.notes;

INSERT INTO player_match_stats (player_id, match_id, runs_scored, balls_faced, rating, notes) VALUES
((SELECT player_id FROM players WHERE email = 'rohit.sharma@seed.msms.local'), 5, 47, 30, 8.2, 'Aggressive powerplay start'),
((SELECT player_id FROM players WHERE email = 'suryakumar.yadav@seed.msms.local'), 5, 61, 34, 8.9, 'Match-shaping middle overs acceleration'),
((SELECT player_id FROM players WHERE email = 'hardik.pandya@seed.msms.local'), 5, 28, 14, 7.7, 'Strong death overs cameo'),
((SELECT player_id FROM players WHERE email = 'ruturaj.gaikwad@seed.msms.local'), 5, 54, 38, 8.0, 'Kept the chase alive'),
((SELECT player_id FROM players WHERE email = 'shivam.dube@seed.msms.local'), 5, 32, 18, 7.2, 'Counter-attacking cameo')
ON CONFLICT(player_id, match_id) DO UPDATE SET runs_scored=excluded.runs_scored, balls_faced=excluded.balls_faced, rating=excluded.rating, notes=excluded.notes;

INSERT INTO player_match_stats (player_id, match_id, wickets_taken, runs_conceded, overs_bowled, rating, notes) VALUES
((SELECT player_id FROM players WHERE email = 'jasprit.bumrah@seed.msms.local'), 5, 3, 24, 4.0, 9.3, 'Elite death bowling sealed the match'),
((SELECT player_id FROM players WHERE email = 'trent.boult@seed.msms.local'), 5, 1, 31, 4.0, 7.2, 'Early movement with the new ball'),
((SELECT player_id FROM players WHERE email = 'noor.ahmad@seed.msms.local'), 5, 2, 34, 4.0, 7.4, 'Threatened through the middle overs')
ON CONFLICT(player_id, match_id) DO UPDATE SET wickets_taken=excluded.wickets_taken, runs_conceded=excluded.runs_conceded, overs_bowled=excluded.overs_bowled, rating=excluded.rating, notes=excluded.notes;

INSERT INTO player_match_stats (player_id, match_id, runs_scored, balls_faced, rating, notes) VALUES
((SELECT player_id FROM players WHERE email = 'suryakumar.yadav@seed.msms.local'), 7, 44, 27, 8.4, 'Inventive strokeplay lifted India late'),
((SELECT player_id FROM players WHERE email = 'hardik.pandya@seed.msms.local'), 7, 31, 16, 7.9, 'Finished the innings strongly'),
((SELECT player_id FROM players WHERE email = 'travis.head@seed.msms.local'), 7, 39, 24, 7.6, 'Fast start in the chase'),
((SELECT player_id FROM players WHERE email = 'marcus.stoinis@seed.msms.local'), 7, 28, 15, 7.1, 'Kept Australia in the hunt')
ON CONFLICT(player_id, match_id) DO UPDATE SET runs_scored=excluded.runs_scored, balls_faced=excluded.balls_faced, rating=excluded.rating, notes=excluded.notes;

INSERT INTO player_match_stats (player_id, match_id, wickets_taken, runs_conceded, overs_bowled, rating, notes) VALUES
((SELECT player_id FROM players WHERE email = 'jasprit.bumrah@seed.msms.local'), 7, 2, 21, 4.0, 9.0, 'Closed the innings with control and pace changes'),
((SELECT player_id FROM players WHERE email = 'pat.cummins@seed.msms.local'), 7, 1, 29, 4.0, 7.3, 'Led Australia''s attack'),
((SELECT player_id FROM players WHERE email = 'mitchell.starc@seed.msms.local'), 7, 2, 34, 4.0, 7.7, 'Struck early and returned well at the death')
ON CONFLICT(player_id, match_id) DO UPDATE SET wickets_taken=excluded.wickets_taken, runs_conceded=excluded.runs_conceded, overs_bowled=excluded.overs_bowled, rating=excluded.rating, notes=excluded.notes;

INSERT INTO player_match_stats (player_id, match_id, points_won, sets_won, games_won, rating, notes) VALUES
((SELECT player_id FROM players WHERE email = 'novak.djokovic@seed.msms.local'), 8, 96, 2, 18, 8.8, 'Managed the match expertly in the deciding set'),
((SELECT player_id FROM players WHERE email = 'carlos.alcaraz@seed.msms.local'), 8, 89, 1, 15, 8.1, 'Electric second set and strong baseline play')
ON CONFLICT(player_id, match_id) DO UPDATE SET points_won=excluded.points_won, sets_won=excluded.sets_won, games_won=excluded.games_won, rating=excluded.rating, notes=excluded.notes;

INSERT INTO player_match_stats (player_id, match_id, points_won, sets_won, rating, notes) VALUES
((SELECT player_id FROM players WHERE email = 'lakshya.sen@seed.msms.local'), 10, 58, 2, 8.7, 'Controlled the pace and won the longer rallies'),
((SELECT player_id FROM players WHERE email = 'anders.antonsen@seed.msms.local'), 10, 51, 1, 7.9, 'Forced a decider with an attacking second game')
ON CONFLICT(player_id, match_id) DO UPDATE SET points_won=excluded.points_won, sets_won=excluded.sets_won, rating=excluded.rating, notes=excluded.notes;

INSERT INTO match_rosters (match_id, player_id, team_id, lineup_position, is_starting) VALUES
(5, (SELECT player_id FROM players WHERE email = 'rohit.sharma@seed.msms.local'), 1, 1, 1),
(5, (SELECT player_id FROM players WHERE email = 'ryan.rickelton@seed.msms.local'), 1, 2, 1),
(5, (SELECT player_id FROM players WHERE email = 'suryakumar.yadav@seed.msms.local'), 1, 3, 1),
(5, (SELECT player_id FROM players WHERE email = 'tilak.varma@seed.msms.local'), 1, 4, 1),
(5, (SELECT player_id FROM players WHERE email = 'hardik.pandya@seed.msms.local'), 1, 5, 1),
(5, (SELECT player_id FROM players WHERE email = 'trent.boult@seed.msms.local'), 1, 6, 1),
(5, (SELECT player_id FROM players WHERE email = 'jasprit.bumrah@seed.msms.local'), 1, 7, 1),
(5, (SELECT player_id FROM players WHERE email = 'ruturaj.gaikwad@seed.msms.local'), 2, 1, 1),
(5, (SELECT player_id FROM players WHERE email = 'devon.conway@seed.msms.local'), 2, 2, 1),
(5, (SELECT player_id FROM players WHERE email = 'shivam.dube@seed.msms.local'), 2, 3, 1),
(5, (SELECT player_id FROM players WHERE email = 'ravindra.jadeja@seed.msms.local'), 2, 4, 1),
(5, (SELECT player_id FROM players WHERE email = 'ms.dhoni@seed.msms.local'), 2, 5, 1),
(5, (SELECT player_id FROM players WHERE email = 'noor.ahmad@seed.msms.local'), 2, 6, 1),
(5, (SELECT player_id FROM players WHERE email = 'ravichandran.ashwin@seed.msms.local'), 2, 7, 1),
(7, (SELECT player_id FROM players WHERE email = 'rohit.sharma@seed.msms.local'), 11, 1, 1),
(7, (SELECT player_id FROM players WHERE email = 'virat.kohli@seed.msms.local'), 11, 2, 1),
(7, (SELECT player_id FROM players WHERE email = 'suryakumar.yadav@seed.msms.local'), 11, 3, 1),
(7, (SELECT player_id FROM players WHERE email = 'hardik.pandya@seed.msms.local'), 11, 4, 1),
(7, (SELECT player_id FROM players WHERE email = 'jasprit.bumrah@seed.msms.local'), 11, 5, 1),
(7, (SELECT player_id FROM players WHERE email = 'travis.head@seed.msms.local'), 12, 1, 1),
(7, (SELECT player_id FROM players WHERE email = 'pat.cummins@seed.msms.local'), 12, 2, 1),
(7, (SELECT player_id FROM players WHERE email = 'mitchell.starc@seed.msms.local'), 12, 3, 1),
(7, (SELECT player_id FROM players WHERE email = 'glenn.maxwell@seed.msms.local'), 12, 4, 1),
(7, (SELECT player_id FROM players WHERE email = 'marcus.stoinis@seed.msms.local'), 12, 5, 1);

-- ============================================================
-- PLAYER_SPORTS JUNCTION
-- ============================================================
-- Associating players with their registered sports.
-- Many-to-many relationship allows players to play multiple sports.

-- CRICKET PLAYERS (Sport ID 1)
INSERT INTO player_sports (player_id, sport_id)
SELECT player_id, 1 FROM players WHERE team_id BETWEEN 1 AND 15;

-- FOOTBALL PLAYERS (Sport ID 2)
INSERT INTO player_sports (player_id, sport_id)
SELECT player_id, 2 FROM players WHERE team_id BETWEEN 16 AND 30;

-- TENNIS PLAYERS (Sport ID 3)
INSERT INTO player_sports (player_id, sport_id)
SELECT player_id, 3 FROM players WHERE team_id BETWEEN 31 AND 35;

-- BADMINTON PLAYERS (Sport ID 4)
INSERT INTO player_sports (player_id, sport_id)
SELECT player_id, 4 FROM players WHERE team_id BETWEEN 36 AND 40;

-- MULTI-SPORT ENTRIES (For Demonstration)
-- Virat Kohli also plays Football
INSERT INTO player_sports (player_id, sport_id)
VALUES ((SELECT player_id FROM players WHERE email = 'virat.kohli@seed.msms.local'), 2);

-- Trent Alexander-Arnold also plays Cricket
INSERT INTO player_sports (player_id, sport_id)
VALUES ((SELECT player_id FROM players WHERE email = 'trent.alexander-arnold@seed.msms.local'), 1);

-- Harry Kane also plays Cricket
INSERT INTO player_sports (player_id, sport_id)
VALUES ((SELECT player_id FROM players WHERE email = 'harry.kane@seed.msms.local'), 1);
