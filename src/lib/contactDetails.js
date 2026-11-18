// Optional structured fields for local demonstration contacts.
// Legacy free-text contact information remains in values[2] unchanged.
export function validateContactDetails(email, phone){
 if(typeof email!=="string"||typeof phone!=="string")throw new TypeError("Coordonnées invalides");
 const cleanEmail=email.trim(),cleanPhone=phone.trim();
 if(cleanEmail.length>320||cleanEmail&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(cleanEmail)||/[\r\n]/u.test(cleanEmail))){
  throw new TypeError("Adresse e-mail invalide");
 }
 const digits=cleanPhone.replace(/\D/gu,"");
 if(cleanPhone.length>64||cleanPhone&&(!/^[+0-9 ().-]{6,64}$/u.test(cleanPhone)||digits.length<6||digits.length>15)){
  throw new TypeError("Téléphone invalide");
 }
 return {email:cleanEmail,phone:cleanPhone};
}
