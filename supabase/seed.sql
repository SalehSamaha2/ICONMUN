-- =====================================================================
-- ICON MUN - starter content (exactly what the site shows today).
-- Run AFTER schema.sql. Only fills EMPTY tables, so it is safe to run twice.
-- =====================================================================

insert into public.committees (sort_order, code, name, icon, topic, level, seats, charter, focus_questions, key_countries, background_overview)
select * from (values
  (10, $q$Council I$q$, $q$Council I (TBA)$q$, $q$shield$q$, $q$Topic TBA — Under Secretariat Review$q$, 'TBA', 'Seats TBA', $q$Council charter and mandate to be announced by the Secretariat.$q$, array[$q$Inquiries and research directives TBA.$q$,$q$Discussion prompts TBA.$q$]::text[], array[$q$Allotments TBA$q$]::text[], $q$The official background guide and rules of procedure are currently being prepared by the High Secretariat for ICON MUN 2027.$q$),
  (20, $q$Council II$q$, $q$Council II (TBA)$q$, $q$eye$q$, $q$Topic TBA — Under Secretariat Review$q$, 'TBA', 'Seats TBA', $q$Council charter and mandate to be announced by the Secretariat.$q$, array[$q$Inquiries and research directives TBA.$q$,$q$Discussion prompts TBA.$q$]::text[], array[$q$Allotments TBA$q$]::text[], $q$The official background guide and rules of procedure are currently being prepared by the High Secretariat for ICON MUN 2027.$q$),
  (30, $q$Council III$q$, $q$Council III (TBA)$q$, $q$lock$q$, $q$Topic TBA — Under Secretariat Review$q$, 'TBA', 'Seats TBA', $q$Council charter and mandate to be announced by the Secretariat.$q$, array[$q$Inquiries and research directives TBA.$q$,$q$Discussion prompts TBA.$q$]::text[], array[$q$Allotments TBA$q$]::text[], $q$The official background guide and rules of procedure are currently being prepared by the High Secretariat for ICON MUN 2027.$q$),
  (40, $q$Council IV$q$, $q$Council IV (TBA)$q$, $q$activity$q$, $q$Topic TBA — Under Secretariat Review$q$, 'TBA', 'Seats TBA', $q$Council charter and mandate to be announced by the Secretariat.$q$, array[$q$Inquiries and research directives TBA.$q$,$q$Discussion prompts TBA.$q$]::text[], array[$q$Allotments TBA$q$]::text[], $q$The official background guide and rules of procedure are currently being prepared by the High Secretariat for ICON MUN 2027.$q$),
  (50, $q$Council V$q$, $q$Council V (TBA)$q$, $q$landmark$q$, $q$Topic TBA — Under Secretariat Review$q$, 'TBA', 'Seats TBA', $q$Council charter and mandate to be announced by the Secretariat.$q$, array[$q$Inquiries and research directives TBA.$q$,$q$Discussion prompts TBA.$q$]::text[], array[$q$Allotments TBA$q$]::text[], $q$The official background guide and rules of procedure are currently being prepared by the High Secretariat for ICON MUN 2027.$q$)
) as v(sort_order, code, name, icon, topic, level, seats, charter, focus_questions, key_countries, background_overview)
where not exists (select 1 from public.committees);

do $$
declare d uuid;
begin
  if exists (select 1 from public.schedule_days) then return; end if;
  insert into public.schedule_days (sort_order, day_number, day_label, day_theme) values (10, 1, $q$DAY 01$q$, $q$Opening & Committee Sessions · TBA$q$) returning id into d;
  insert into public.schedule_events (day_id, sort_order, time_label, title, location, description, badge) values (d, 10, 'TBA', $q$Check-In & Accreditation$q$, $q$Venue: TBA$q$, $q$Delegate badge and materials distribution. Timetable To Be Announced.$q$, 'TBA');
  insert into public.schedule_events (day_id, sort_order, time_label, title, location, description, badge) values (d, 20, 'TBA', $q$Opening Ceremony$q$, $q$Hall: TBA$q$, $q$Opening address by the High Secretariat. Timetable To Be Announced.$q$, 'TBA');
  insert into public.schedule_events (day_id, sort_order, time_label, title, location, description, badge) values (d, 30, 'TBA', $q$Committee Session I$q$, $q$Chambers: TBA$q$, $q$Initial roll call and debate. Timetable To Be Announced.$q$, 'TBA');
  insert into public.schedule_days (sort_order, day_number, day_label, day_theme) values (20, 2, $q$DAY 02$q$, $q$Substantive Debate & Directives · TBA$q$) returning id into d;
  insert into public.schedule_events (day_id, sort_order, time_label, title, location, description, badge) values (d, 10, 'TBA', $q$Committee Session II$q$, $q$Chambers: TBA$q$, $q$Working papers and moderated caucusing. Timetable To Be Announced.$q$, 'TBA');
  insert into public.schedule_events (day_id, sort_order, time_label, title, location, description, badge) values (d, 20, 'TBA', $q$Committee Session III$q$, $q$Chambers: TBA$q$, $q$Directives and crisis developments. Timetable To Be Announced.$q$, 'TBA');
  insert into public.schedule_days (sort_order, day_number, day_label, day_theme) values (30, 3, $q$DAY 03$q$, $q$Resolutions & Closing Ceremony · TBA$q$) returning id into d;
  insert into public.schedule_events (day_id, sort_order, time_label, title, location, description, badge) values (d, 10, 'TBA', $q$Committee Session IV$q$, $q$Chambers: TBA$q$, $q$Resolution amendments and voting. Timetable To Be Announced.$q$, 'TBA');
  insert into public.schedule_events (day_id, sort_order, time_label, title, location, description, badge) values (d, 20, 'TBA', $q$Closing Plenary & Awards$q$, $q$Hall: TBA$q$, $q$Closing address and delegate commendations. Timetable To Be Announced.$q$, 'TBA');
end $$;

insert into public.secretariat (sort_order, name, role, image_url, quote, bio, is_confirmed, object_position)
select * from (values
  (10, $q$Laila Mohammad$q$, $q$Secretary-General$q$, $q$/assets/aistudio/WhatsApp_Image_2026-10-21_at_3.09.45_PM_b7951032.jpeg$q$, $q$I hope we can support each other, share our ideas, and make ICON MUN 2027 a successful and unforgettable experience for everyone!! 🤍$q$, $q$hiii everyoneeee!! my name is laila mohammad, and im the secretary-general of icon mun 2027!! im so happy to be part of this journey and to work with such an amazing team. i hope we can support each other, share our ideas, and make icon mun 2027 a successful and unforgettable experience for everyone!! 🤍$q$, true, $q$center 85%$q$),
  (20, $q$Laya Shahwan$q$, $q$Deputy Secretary-General$q$, $q$/assets/aistudio/WhatsApp_Image_2026-10-21_at_5.27.20_PM_1145c352.jpeg$q$, $q$I’m really happy to be working with my team to create the best and memorable MUN!!$q$, $q$hellooo everyone, my name is laya shahwan and i’m the deputy secretary-general of icon mun 2027! i’m really happy to be working with my team to create the best and memorable mun!!$q$, true, $q$50% 35%$q$),
  (30, $q$Lara Alabsi$q$, $q$Under-Secretary-General$q$, $q$/assets/aistudio/WhatsApp_Image_2026-10-21_at_3.25.06_PM_bb8c5329.jpeg$q$, $q$Excited to meet you all and make this MUN one to remember, pls don’t make me regret being nice!$q$, $q$hiii everyone im lara, your amazing, goated USG!! if you don’t know me yet give it a week, i talk enough for that to change. excited to meet you all and make this MUN one to remember, pls don’t make me regret being nice$q$, true, $q$center 32%$q$)
) as v(sort_order, name, role, image_url, quote, bio, is_confirmed, object_position)
where not exists (select 1 from public.secretariat);

insert into public.settings (key, value) values
  ('registration_open', 'true'),
  ('contact_email',     ''),
  ('contact_phone',     ''),
  ('venue',             ''),
  ('instagram_url',     ''),
  ('linkedin_url',      ''),
  ('twitter_url',       ''),
  ('telegram_url',      '')
on conflict (key) do nothing;
