import { Redirect } from 'expo-router';

// Root index — redirect to main tabs
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
