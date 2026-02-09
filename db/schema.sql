-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  extension text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  project_id character varying,
  folder_path text,
  room_code text,
  CONSTRAINT files_pkey PRIMARY KEY (id),
  CONSTRAINT files_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text,
  email text,
  created_at timestamp without time zone DEFAULT now(),
  github_token text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.room_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id integer NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text, 'guest'::text])),
  join_token uuid,
  joined_at timestamp with time zone DEFAULT now(),
  last_seen timestamp with time zone,
  download_path text,
  kicked_user boolean,
  CONSTRAINT room_members_pkey PRIMARY KEY (id),
  CONSTRAINT room_members_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.rooms (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  type text,
  room_name character varying NOT NULL,
  room_code character varying NOT NULL,
  room_password character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  room_link text,
  is_room_new boolean NOT NULL DEFAULT true,
  file_upload_by USER-DEFINED,
  github_repo text,
  github_token text,
  last_join timestamp with time zone,
  is_email_send boolean,
  active boolean DEFAULT true,
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);