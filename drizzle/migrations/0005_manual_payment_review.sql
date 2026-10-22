CREATE TABLE IF NOT EXISTS public.payment_submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 player_entry_id uuid NOT NULL UNIQUE REFERENCES public.player_entries(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 payer_name text NOT NULL DEFAULT '',
 proof_path text NOT NULL,
 transaction_reference text NOT NULL,
 amount integer NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
 review_note text NOT NULL DEFAULT '',
 submitted_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz,
 reviewed_by uuid
);

GRANT SELECT ON public.payment_submissions TO authenticated;
GRANT ALL ON public.payment_submissions TO service_role;
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_submissions' AND policyname = 'payment_read') THEN
    CREATE POLICY payment_read ON public.payment_submissions FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_entries' AND policyname = 'payment_entry_staff_read') THEN
    CREATE POLICY payment_entry_staff_read ON public.player_entries FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.submit_payment_proof(entry_id uuid, object_path text, reference text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e public.player_entries; existing public.payment_submissions;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
 SELECT * INTO e FROM public.player_entries WHERE id=entry_id AND user_id=auth.uid();
 IF e.id IS NULL THEN RAISE EXCEPTION 'Link your tournament entry first.'; END IF;
 IF e.game NOT IN ('bgmi','fc-mobile') THEN RAISE EXCEPTION 'Unsupported game.'; END IF;
 IF length(trim(coalesce(reference,''))) NOT BETWEEN 3 AND 100 THEN RAISE EXCEPTION 'Enter a transaction reference of 3 to 100 characters.'; END IF;
 IF split_part(object_path,'/',1)<>auth.uid()::text OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='payment-proofs' AND name=object_path) THEN RAISE EXCEPTION 'Upload your payment proof first.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(entry_id::text,0));
 SELECT * INTO existing FROM public.payment_submissions WHERE player_entry_id=entry_id FOR UPDATE;
 IF existing.id IS NOT NULL AND existing.status<>'rejected' THEN RAISE EXCEPTION 'This payment is already submitted or verified.'; END IF;
 INSERT INTO public.payment_submissions(player_entry_id,user_id,payer_name,proof_path,transaction_reference,amount)
 VALUES(e.id,auth.uid(),coalesce((SELECT display_name FROM public.profiles WHERE id=auth.uid()),'Player'),object_path,trim(reference),CASE e.game WHEN 'bgmi' THEN 200 ELSE 300 END)
 ON CONFLICT(player_entry_id) DO UPDATE SET proof_path=EXCLUDED.proof_path,transaction_reference=EXCLUDED.transaction_reference,status='pending',review_note='',submitted_at=now(),reviewed_at=NULL,reviewed_by=NULL;
END $$;

REVOKE ALL ON FUNCTION public.submit_payment_proof(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_payment_proof(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_payment_proof(submission_id uuid, decision text, note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'An approved staff account is required.'; END IF;
 IF decision NOT IN ('verified','rejected') OR decision IS NULL THEN RAISE EXCEPTION 'Choose verified or rejected.'; END IF;
 IF length(coalesce(note,''))>500 OR (decision='rejected' AND length(trim(coalesce(note,'')))<3) THEN RAISE EXCEPTION 'Provide a rejection reason (3 to 500 characters).'; END IF;
 UPDATE public.payment_submissions SET status=decision,review_note=trim(coalesce(note,'')),reviewed_by=auth.uid(),reviewed_at=now() WHERE id=submission_id AND status='pending';
 IF NOT FOUND THEN RAISE EXCEPTION 'This proof has already been reviewed. Refresh the list.'; END IF;
END $$;

REVOKE ALL ON FUNCTION public.review_payment_proof(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_payment_proof(uuid,text,text) TO authenticated;
