import { SkillDefinition } from '../../../types/kos';

export function getNativeAndSwarmSkills(baseTime: number): SkillDefinition[] {
  return [
    {
      id: 'skill-react-native-expert',
      name: 'react-native-expert',
      description: 'React Native & Expo cross-platform mobile architecture, Reanimated, gesture handling, and FlashList.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/react-native' },
        { type: 'slash_command', pattern: '/rn' },
        { type: 'slash_command', pattern: '/expo' },
        { type: 'intent', pattern: 'react native' },
        { type: 'intent', pattern: 'expo mobile' },
      ],
      instructions: `Architect high-performance cross-platform React Native and Expo applications:
1. Compose responsive mobile layouts with React Native primitives (View, Text, Pressable, ScrollView) using StyleSheet or NativeWind.
2. Maximize list rendering performance using FlashList / FlatList with proper item layout estimation and key extractors.
3. Construct 60/120fps native-driven gestures and animations using react-native-reanimated and react-native-gesture-handler.
4. Implement offline-first storage (MMKV / WatermelonDB), deep linking schemes, and platform permission request flows (Camera, Location).`,
      allowedTools: ['read_file', 'create_file', 'edit_file'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-flutter-dart-master',
      name: 'flutter-dart-master',
      description: 'Flutter widget tree composition, BLoC / Riverpod / Provider state management, and Dart sound null-safety.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/flutter' },
        { type: 'slash_command', pattern: '/dart' },
        { type: 'intent', pattern: 'flutter widget' },
        { type: 'intent', pattern: 'dart null safety' },
        { type: 'intent', pattern: 'bloc state management' },
      ],
      instructions: `Engineer robust Flutter & Dart cross-platform mobile architectures:
1. Deconstruct complex UIs into clean StatelessWidget and StatefulWidget hierarchies, custom Slivers, and LayoutBuilders.
2. Structure scalable state management using BLoC / Cubit or Riverpod with immutable state classes (Freezed).
3. Leverage modern Dart 3 features: sound null-safety, records, pattern matching, sealed classes, and extension methods.
4. Eliminate jank via const constructors and RepaintBoundary; implement type-safe platform channels (MethodChannel) for native OS bridges.`,
      allowedTools: ['read_file', 'create_file', 'edit_file'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-android-native',
      name: 'android-native',
      description: 'Native Android architecture with Kotlin, Jetpack Compose, Coroutines, StateFlow, Room, and Gradle builds.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/android' },
        { type: 'slash_command', pattern: '/kotlin' },
        { type: 'intent', pattern: 'android jetpack compose' },
        { type: 'intent', pattern: 'kotlin coroutines' },
      ],
      instructions: `Develop modern native Android applications:
1. Design declarative, responsive UIs with Jetpack Compose using unidirectional data flow (UDF) and State hoisting.
2. Orchestrate asynchronous reactive streams using Kotlin Coroutines and StateFlow / SharedFlow with structured concurrency.
3. Implement clean MVVM / MVI architecture leveraging Hilt for dependency injection and Room for local SQL persistence.
4. Configure Gradle build files, ProGuard / R8 code shrinking rules, and runtime permission handling in AndroidManifest.xml.`,
      allowedTools: ['read_file', 'create_file', 'edit_file'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-ios-native',
      name: 'ios-native',
      description: 'Native iOS app engineering with Swift, SwiftUI, Combine, Swift Concurrency, and SwiftData.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/ios' },
        { type: 'slash_command', pattern: '/swift' },
        { type: 'intent', pattern: 'swiftui' },
        { type: 'intent', pattern: 'ios swift' },
      ],
      instructions: `Build premium native iOS applications:
1. Construct declarative SwiftUI views utilizing modern state wrappers (@State, @Binding, @Observable macro, @Environment).
2. Employ modern Swift Concurrency (async/await, TaskGroups, Actors) ensuring UI updates execute on @MainActor without data races.
3. Implement schema-driven offline persistence using SwiftData or CoreData with transactional background context saves.
4. Structure clean navigation (NavigationStack) and configure Info.plist privacy descriptions (App Tracking, Camera, FaceID).`,
      allowedTools: ['read_file', 'create_file', 'edit_file'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-mobile-release-devops',
      name: 'mobile-release-devops',
      description: 'Automated iOS TestFlight & Google Play Store deployment, Fastlane pipelines, and code signing.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/mobile-release' },
        { type: 'slash_command', pattern: '/appstore' },
        { type: 'slash_command', pattern: '/playstore' },
        { type: 'slash_command', pattern: '/fastlane' },
        { type: 'intent', pattern: 'testflight release' },
        { type: 'intent', pattern: 'google play release' },
      ],
      instructions: `Automate end-to-end mobile CI/CD distribution:
1. Script Fastlane lanes (Fastfile, Matchfile, Appfile) for automated beta and production publishing.
2. Automate iOS code signing using Match (git-backed certificates and provisioning profiles) and Android Keystore signing.
3. Configure automated build number increments and semantic app version synchronization across Info.plist and build.gradle.
4. Produce release checklists for App Store Review Guidelines and Google Play Console compliance.`,
      allowedTools: ['read_file', 'create_file', 'edit_file'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-swarm-feature-slicing',
      name: 'swarm-feature-slicing',
      description: 'Concurrently builds Backend API, Database Schema, Reactive UI, and Test Suite with zero file lock collisions.',
      triggers: [
        { type: 'slash_command', pattern: '/swarm-feature' },
        { type: 'slash_command', pattern: '/feature-slice' },
        { type: 'intent', pattern: 'parallel feature build' },
        { type: 'intent', pattern: 'slice feature' },
      ],
      instructions: `Coordinate the 4-tier parallel feature slicing swarm:
1. DatabaseSchemaSpecialist produces isolated models and migration SQL.
2. APIEndpointBuilder constructs concurrent REST/RPC routes and request validators.
3. ReactComponentBuilder delivers responsive UI views and reactive state orchestration.
4. UnitTestWriter validates contracts with comprehensive Vitest coverage.
All tasks run in parallel with strictly segregated file reservations to prevent merge deadlocks.`,
      allowedTools: ['create_file', 'edit_file', 'read_file', 'run_terminal'],
      enabled: true,
      scope: 'global',
      version: '1.0.0',
      author: 'Vertex Forge Swarm Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-swarm-background-guardians',
      name: 'swarm-background-guardians',
      description: 'Silent parallel watchdogs: TypeLintSentry, SecretLeakSniffer, and PerfLeakWatcher for continuous project health.',
      triggers: [
        { type: 'slash_command', pattern: '/swarm-guard' },
        { type: 'slash_command', pattern: '/guardians' },
        { type: 'intent', pattern: 'start background guardians' },
        { type: 'intent', pattern: 'continuous sentry' },
      ],
      instructions: `Maintain continuous background surveillance with zero interference:
1. TypeLintSentry continuously monitors AST syntax, strict types, and module boundaries.
2. SecretLeakSniffer intercepts API tokens, secrets, private keys, and environment leakage.
3. PerfLeakWatcher detects unclosed event listeners, runaway loops, and memory bloat.`,
      allowedTools: ['read_file', 'run_terminal'],
      enabled: true,
      scope: 'global',
      version: '1.0.0',
      author: 'Vertex Forge Swarm Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-swarm-self-healing',
      name: 'swarm-self-healing',
      description: 'Devin-style autonomous diagnostic root cause isolation and surgical patch synthesis for failing tests or errors.',
      triggers: [
        { type: 'slash_command', pattern: '/swarm-heal' },
        { type: 'slash_command', pattern: '/self-heal' },
        { type: 'intent', pattern: 'auto heal tests' },
        { type: 'intent', pattern: 'fix failing tests' },
      ],
      instructions: `Execute autonomous two-phase self-healing:
1. TestRunnerDiagnostician analyzes failing test runner output and stack traces to isolate the exact defect.
2. PatchSynthesizer formulates and applies minimal surgical AST diffs to resolve root cause without altering existing invariants.
3. Re-executes the test runner to guarantee 100% green verification.`,
      allowedTools: ['edit_file', 'read_file', 'run_terminal'],
      enabled: true,
      scope: 'global',
      version: '1.0.0',
      author: 'Vertex Forge Swarm Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-swarm-doc-env-sync',
      name: 'swarm-doc-env-sync',
      description: 'Concurrently synchronizes architectural documentation, TSDoc/OpenAPI specs, and .env.example templates.',
      triggers: [
        { type: 'slash_command', pattern: '/swarm-sync' },
        { type: 'slash_command', pattern: '/sync-docs' },
        { type: 'slash_command', pattern: '/sync-env' },
        { type: 'intent', pattern: 'sync environment and docs' },
      ],
      instructions: `Concurrently sync technical assets across the workspace:
1. DocSyncAgent audits updated interfaces and syncs README.md, TSDoc comments, and OpenAPI specifications.
2. EnvSyncAgent audits all process.env invocations across the codebase and maintains .env.example with documented placeholders.`,
      allowedTools: ['edit_file', 'create_file', 'read_file'],
      enabled: true,
      scope: 'global',
      version: '1.0.0',
      author: 'Vertex Forge Swarm Core',
      createdAt: baseTime,
    },
  ];
}
