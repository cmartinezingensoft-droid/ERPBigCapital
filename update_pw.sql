UPDATE USERS SET password = '$2b$10$Ti6qVu2IKGXBVDiVGnXl/eL7wHMEm2MgSq6KmTDdDMTgyFdzJOD5i' WHERE email = 'cmartinez@ingensoft.es';
SELECT email, LEFT(password, 30) as pw_prefix FROM USERS WHERE email = 'cmartinez@ingensoft.es';
