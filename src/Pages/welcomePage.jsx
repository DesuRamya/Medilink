const WelcomePage = () => {
  return (
    <div style={styles.container}>
      <h1>Welcome to Medilink 🩺</h1>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }
};

export default WelcomePage;
