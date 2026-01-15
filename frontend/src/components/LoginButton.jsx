const API_URL = 'http://localhost:5000';

export default function LoginButton() {
  return (
    <a href={`${API_URL}/auth/google`}>
      Login with Google
    </a>
  );
}
