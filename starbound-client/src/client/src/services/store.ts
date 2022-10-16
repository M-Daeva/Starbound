import { writable } from "svelte/store";

export const user = writable({
  name: "Tiago Vilas Boas",
  phone: "11 972393003",
  email: "tcarvalhovb@gmail.com",
});
