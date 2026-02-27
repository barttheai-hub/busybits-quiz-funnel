import SwiftUI

// MARK: - Models

struct UserDraft {
    var gender: Gender?
    var weight: Double? // lbs
    var heightFt: Int?
    var heightIn: Int?
    var goal: Goal?
    var activity: ActivityLevel?
    var tdee: Int?
}

enum Gender: String, CaseIterable {
    case male = "Male"
    case female = "Female"
}

enum Goal: String, CaseIterable {
    case loseFat = "Lose Fat"
    case buildMuscle = "Build Muscle"
    case maintain = "Maintain"
}

enum ActivityLevel: String, CaseIterable {
    case desk = "Desk Job"
    case active = "Active"
    case athlete = "Athlete"
}

// MARK: - Main Flow Coordinator

struct OnboardingFlowView: View {
    @State private var currentStep: OnboardingStep = .splash
    @State private var userDraft = UserDraft()
    @State private var showSignupModal = false
    
    enum OnboardingStep {
        case splash
        case setupBasics
        case setupGoal
        case setupActivity
        case calculating
        case activation // Search/Log
        case dashboard // The "Aha" moment
    }
    
    var body: some View {
        ZStack {
            Color(hex: "0F172A").edgesIgnoringSafeArea(.all) // Slate 900
            
            switch currentStep {
            case .splash:
                SplashView { withAnimation { currentStep = .setupBasics } }
            case .setupBasics:
                SetupBasicsView(draft: $userDraft) { withAnimation { currentStep = .setupGoal } }
            case .setupGoal:
                SetupGoalView(draft: $userDraft) { withAnimation { currentStep = .setupActivity } }
            case .setupActivity:
                SetupActivityView(draft: $userDraft) { 
                    withAnimation { currentStep = .calculating }
                    // Simulate calculation delay
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                        withAnimation { currentStep = .activation }
                    }
                }
            case .calculating:
                CalculationLoaderView()
            case .activation:
                ActivationView { 
                    withAnimation { currentStep = .dashboard }
                }
            case .dashboard:
                DashboardPreviewView(showModal: $showSignupModal)
            }
            
            // Soft Reg Modal
            if showSignupModal {
                Color.black.opacity(0.6).edgesIgnoringSafeArea(.all)
                VStack {
                    Spacer()
                    SignupModalView()
                        .transition(.move(edge: .bottom))
                }
            }
        }
    }
}

// MARK: - Subviews

struct SplashView: View {
    var onStart: () -> Void
    
    var body: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: "flame.fill") // Placeholder logo
                .resizable()
                .frame(width: 60, height: 60)
                .foregroundColor(.blue)
            
            Text("The 3-Second\nCalorie Counter")
                .font(.system(size: 36, weight: .heavy, design: .rounded))
                .multilineTextAlignment(.center)
                .foregroundColor(.white)
            
            Text("Stop wasting time. Start losing weight.")
                .font(.body)
                .foregroundColor(.gray)
                .padding(.bottom, 40)
            
            Button(action: onStart) {
                Text("Start Tracking")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
            }
            .padding(.horizontal, 40)
            
            Spacer()
            
            Text("Already have an account? Log in")
                .font(.caption)
                .foregroundColor(.gray)
        }
    }
}

struct SetupBasicsView: View {
    @Binding var draft: UserDraft
    var onNext: () -> Void
    
    var body: some View {
        VStack(spacing: 30) {
            Text("Let's calibrate your engine.")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
            
            HStack(spacing: 20) {
                Button(action: { draft.gender = .male }) {
                    Text("Male").padding().frame(maxWidth: .infinity).background(draft.gender == .male ? Color.blue : Color.gray.opacity(0.3)).cornerRadius(10)
                }
                Button(action: { draft.gender = .female }) {
                    Text("Female").padding().frame(maxWidth: .infinity).background(draft.gender == .female ? Color.blue : Color.gray.opacity(0.3)).cornerRadius(10)
                }
            }
            .foregroundColor(.white)
            
            TextField("Weight (lbs)", value: $draft.weight, formatter: NumberFormatter())
                .keyboardType(.decimalPad)
                .padding()
                .background(Color.gray.opacity(0.2))
                .cornerRadius(10)
                .foregroundColor(.white)
            
            Button(action: onNext) {
                Text("Next").frame(maxWidth: .infinity).padding().background(Color.blue).cornerRadius(10).foregroundColor(.white)
            }
        }
        .padding()
    }
}

// ... Additional views ...
