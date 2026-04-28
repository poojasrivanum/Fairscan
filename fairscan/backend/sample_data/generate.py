import pandas as pd
import numpy as np
np.random.seed(42)
n = 300
gender = np.random.choice(['Male','Female'], n, p=[0.6,0.4])
race = np.random.choice(['White','Black','Asian','Hispanic'], n, p=[0.5,0.2,0.2,0.1])
age = np.random.randint(22, 58, n)
education = np.random.choice(['High School','Bachelor','Master','PhD'], n, p=[0.2,0.45,0.25,0.1])
experience = np.random.randint(0, 20, n)
department = np.random.choice(['Engineering','Sales','Marketing','Operations','HR'], n)
hired = []
for i in range(n):
    base = 0.55
    if gender[i] == 'Male': base += 0.17
    else: base -= 0.14
    if race[i] == 'White': base += 0.15
    elif race[i] == 'Black': base -= 0.17
    elif race[i] == 'Asian': base += 0.10
    elif race[i] == 'Hispanic': base -= 0.11
    if education[i] == 'PhD': base += 0.12
    elif education[i] == 'Master': base += 0.08
    elif education[i] == 'Bachelor': base += 0.04
    base += experience[i] * 0.005
    base = max(0.05, min(0.95, base))
    hired.append(1 if np.random.random() < base else 0)
df = pd.DataFrame({'age':age,'gender':gender,'race':race,'education':education,'experience_years':experience,'department':department,'hired':hired})
df.to_csv('/home/claude/fairscan/backend/sample_data/hiring.csv', index=False)
print("Generated", len(df), "rows")
print(df.groupby('gender')['hired'].mean())
print(df.groupby('race')['hired'].mean())
