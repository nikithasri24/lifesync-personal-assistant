-- Create partner test user
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- Insert user with all required fields
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    is_anonymous,
    confirmation_token,
    recovery_token,
    email_change_token_current,
    email_change_token_new,
    reauthentication_token,
    phone_change_token,
    phone_change,
    email_change_confirm_status
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'partner.test@lifesync.com',
    crypt('TestPartner123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test Partner"}',
    false,
    false,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    0
  );

  -- Insert identity
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    'partner.test@lifesync.com',
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', 'partner.test@lifesync.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Created user with ID: %', new_user_id;
END $$;

-- Verify
SELECT id, email FROM auth.users WHERE email = 'partner.test@lifesync.com';

