/** RFC de persona moral (3 letras) o física (4 letras) + fecha + homoclave */
export const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;