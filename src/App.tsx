import styles from "./App.module.css";
import rentTogetherIcon from "./shared/assets/renttogether-icon.svg";
import { OwnerItemsWorkspace } from "./pages/items/OwnerItemsWorkspace";

function App() {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>
        <img className={styles.logo} src={rentTogetherIcon} width={54} height={45} alt="" />
        RentTogether
      </h1>
      <p>Miete, was du brauchst. Teile, was du hast.</p>
      <OwnerItemsWorkspace />
    </main>
  );
}

export default App;
