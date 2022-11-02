<script lang="ts">
  export { text, clickHandler };

  let text: string = "";
  let clickHandler: () => void;
</script>

<button on:click|preventDefault={clickHandler}>{text}</button>

<style>
  button {
    text-align: center;
    padding: 0;
    width: 100px;
    height: 35px;
    border-radius: 15px;
    color: white;
    background: linear-gradient(90deg, #ee3a87 0%, #4a66e7 100%)
      rgba(0, 0, 0, 0.2);
    outline: none;
    border-width: 0px;
  }

  button:hover {
    filter: saturate(1.5);
    cursor: pointer;
  }
</style>
