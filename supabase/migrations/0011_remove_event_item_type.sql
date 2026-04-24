begin;

delete from public.items
where type = 'event';

alter type public.item_type rename to item_type_old;

create type public.item_type as enum ('pour', 'food', 'merch');

alter table public.items
alter column type type public.item_type
using type::text::public.item_type;

drop type public.item_type_old;

commit;
