import styles from "./App.module.css";
import { NewItemPage } from "./pages/items/NewItemPage";

function App() {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>RentTogether</h1>
      <p>Miete, was du brauchst. Teile, was du hast.</p>
      <NewItemPage />
    </main>
  );
}

export default App;
