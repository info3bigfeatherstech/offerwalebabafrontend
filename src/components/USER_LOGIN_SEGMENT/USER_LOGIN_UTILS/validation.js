export const validateEmail = (email) => {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};

export const validatePassword = (password) => {
    // At least 6 characters, at least one letter and one number
    const re = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return re.test(password);
};

export const validateName = (name) => {
    return name && name.trim().length >= 2;
};

export const validatePhone = (phone) => {
    if (!phone) return true; 
    const re = /^[0-9]{10}$/;
    return re.test(phone.replace(/\D/g, ''));
};

// export const validateEmail = (email) => {
//     return String(email)
//         .toLowerCase()
//         .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
// };

// export const validatePassword = (pass) => {
//     // Min 6 chars, at least one letter and one number
//     return pass.length >= 6 && /\d/.test(pass) && /[a-zA-Z]/.test(pass);
// };

// export const validateMobile = (num) => {
//     return /^[6-9]\d{9}$/.test(num);
// };