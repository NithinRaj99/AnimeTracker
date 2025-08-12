import { signInWithGoogle } from './firebase';
import './Login.css';

function Login({ onLogin }) {
  const handleGoogleLogin = () => {
    signInWithGoogle()
      .then((result) => {
        const user = result.user;
        onLogin(user); // send user data to parent
      })
      .catch((error) => {
        console.error("Google sign-in error", error);
      });
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <button onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
    </div>
  );
}

export default Login;