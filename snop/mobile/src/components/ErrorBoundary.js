import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
    // To do: Send to error tracking service (Sentry, etc.)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>Noe gikk galt</Text>
            <Text style={styles.message}>
              En uventet feil oppstod. Vennligst prøv igjen.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.debugBox}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Prøv igjen</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#EF4444",
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  debugBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
    width: "100%",
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  debugText: {
    fontSize: 10,
    color: "#666",
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: "#3498db",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 150,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
