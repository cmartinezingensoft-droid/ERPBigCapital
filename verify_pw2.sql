SELECT email, LEFT(password, 40) as pw_prefix, LENGTH(password) as pw_len FROM USERS WHERE email = 'cmartinez@ingensoft.es';
