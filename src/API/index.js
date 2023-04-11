export const  getOrders = () => {
  return fetch("https://dummyjson.com/carts/1").then((res) => res.json());
};

export const getRevenue = () => {
  return fetch("https://dummyjson.com/carts").then((res) => res.json());
};

export const getSupportTickets = () => {
    return fetch('https://dummyjson.com/products').then((res) => res.json());
}

// export const getCustomers = () => {
//     return fetch('https://dummyjson.com/users').then((res) => res.json());
// }

export const getCustomers = () => {
  return fetch('http://127.0.0.1:5000/data').then((res) => res.json());
}

export const getDataTickets = () => {
  return fetch('http://127.0.0.1:5000/data').then((res) => res.json());
}

export const getComments = () => {
    return fetch('https://dummyjson.com/comments').then((res) => res.json());
}

