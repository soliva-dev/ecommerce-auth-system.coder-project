/**
 * DTO para transferir datos seguros del usuario
 * Filtra información sensible como password, timestamps innecesarios
 */
export class UserDTO {
    constructor(user) {
        this.id = user._id;
        this.firstName = user.first_name;
        this.lastName = user.last_name;
        this.email = user.email;
        this.age = user.age;
        this.role = user.role;
        this.cart = user.cart ? {
            id: user.cart._id,
            products: user.cart.products || []
        } : null;
        this.fullName = `${user.first_name} ${user.last_name}`;
    }
}

/**
 * DTO para respuesta del endpoint /current
 * Solo información esencial y no sensible
 */
export class CurrentUserDTO {
    constructor(user) {
        this.id = user._id;
        this.firstName = user.first_name;
        this.lastName = user.last_name;
        this.email = user.email;
        this.role = user.role;
        this.cartId = user.cart ? user.cart._id : null;
        this.fullName = `${user.first_name} ${user.last_name}`;
    }
}