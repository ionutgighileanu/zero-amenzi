-- Sincronizarea emailului din auth.users în public.users (D-025).
--
-- `handle_new_user` copiază emailul doar la INSERT. Când un utilizator își
-- schimbă adresa prin Supabase Auth (pagina de setări), auth.users.email se
-- actualizează la confirmare, dar oglinda din public.users rămânea pe adresa
-- veche — iar check-expiries și digestul citesc destinatarul de acolo. Deci
-- schimbarea ar fi părut reușită, iar alertele ar fi plecat în continuare la
-- adresa veche.
--
-- SECURITY DEFINER: UPDATE pe public.users.email e revocat pentru clienți
-- (D-022), exact ca emailul să nu poată fi rescris decât pe calea asta.

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;

-- Cât timp schimbarea așteaptă confirmarea, adresa nouă stă în
-- auth.users.new_email, iar `email` rămâne neschimbat — triggerul nu se
-- declanșează. Rulează abia la confirmare, când `email` chiar se schimbă.
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email and new.email is not null)
  execute function public.handle_user_email_change();

-- Aliniere pentru orice divergență apărută înainte de trigger.
update public.users u
   set email = a.email
  from auth.users a
 where a.id = u.id
   and a.email is not null
   and a.email is distinct from u.email;
