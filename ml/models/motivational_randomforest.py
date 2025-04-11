from data_handling import motivation_data_cleaning_version2
from data_handling import get_cleaner
from utils import storage
from sklearn.preprocessing import MinMaxScaler
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import KMeansSMOTE
from pathlib import Path

MODEL_NAME = "motivation_randomforest"

def train(load="rawData", model_name=MODEL_NAME, cleaning:bool=True):
    """
    Trains a Meta model to predict the 'relation' of a student to a project.

    - Cleans data if needed
    - Splits relations into dropout and others
    - Splits data into train & test sets
    - Trains Randomforest
    - Also balances data, because lack of potential and selected students for now
    - Evaluates accuracy of the model
    - Generates scores and saves the predictions to storage

    Returns:
        dict: A dictionary containing test predictions and their scores.
    """
    if cleaning:
        data = get_cleaner("default_cleaner").clean_data(load)
    else:
        data = storage.load_json(load)

    # Check if data was loaded correctly
    if data is None or len(data) == 0:
        print("ERROR: No data available for training.")
        return None
    # Additional check to ensure clean_data is not just a file name
    if isinstance(data, str):
        print(f"ERROR: Expected data but received a file name: {data}")
        return None
    df = pd.DataFrame(data)  # Convert to DataFrame

    print("Columns in cleaned data:", df.columns)  # Debugging

    # Identify One-Hot Encoded `relation_*` Columns
    relation_columns = [col for col in df.columns if "relation_" in col]

    if len(relation_columns) == 0:
        print("ERROR: 'relation' column missing after data cleaning!")
        return None

    # Convert One-Hot Encoded `relation_*` Columns Back to a Single `relation` Column
    df['relation'] = df[relation_columns].idxmax(axis=1)  # Gets the column with max value (1)
    df['relation'] = df['relation'].apply(lambda x: int(x.split("_")[-1]))  # Extracts numerical value

    # Drop one-hot relation columns after merging them
    df = df.drop(columns=relation_columns)

    # Define feature set (excluding relation)
    X = df.drop(columns=['relation'])  # Remove target column
    y = df['relation']  # Target column


    # Jaetaan data
    # Luokitellaan: kaikki paitsi luokka 3 → 0, luokka 3 → 1
    # 1. Luokitusluokan binarisaatio
    y_binary = y.apply(lambda x: 1 if x == 3 else 0)

    # 2. Jako koulutus- ja testidataan
    X_train, X_test, y_train, y_test = train_test_split(X, y_binary, test_size=0.2, random_state=42, stratify=y)

    smote = KMeansSMOTE(
        random_state=42,
        cluster_balance_threshold=0.001,
        kmeans_estimator=2,
        n_jobs=-1
    )
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)

    # 5. RandomForestClassifier (pipelinea ei varsinaisesti tässä tarvita jos ei ole muita vaiheita)
    clf = RandomForestClassifier(
        random_state=42,
        class_weight='balanced',
        n_estimators=100,
        max_depth=10
    )

    # 6. Mallin koulutus
    clf.fit(X_train_res, y_train_res)

    # 7. Ennustaminen ja raportti
    y_pred = clf.predict(X_test)

    print("More detailed info about model:\n")
    print(classification_report(y_test, y_pred, zero_division=1, labels=[0, 1]))
    if storage.save_model(clf, model_name):
        print(f"Model '{model_name}' trained and saved succesfully")
        return True
    else:
        print("Error saving the model")
        return False

def predict(load="rawData", model_name=MODEL_NAME, score_file="motivation_student_scores_meta_default", cleaning:bool=True):
    """
    Loads a trained stacking-model and makes predictions using the storage utility.
    Saves predictions to a JSON file.

    Args:
        data (str): Raw or pre-cleaned data.
        model_name (str): Name of the saved model file to load.
        score_file (str): Name of the file to save predictions.
        cleaning (bool): Whether to clean data before prediction.

    Returns:
        dict: A dictionary containing predictions and scores.
    """

    # load the model
    stacking_model = storage.load_model(model_name)

    if not stacking_model:
        print(f"Model '{model_name}' could not be loaded.")
        return None

    if cleaning:
        data = motivation_data_cleaning_version2.clean_data(load)
    else:
        data = storage.load_json(load)
    # Additional check to ensure clean_data is not just a file name
    if isinstance(data, str):
        print(f"ERROR: Expected data but received a file name: {data}")
        return None

    df = pd.DataFrame(data)  # Convert to DataFrame

    print("Columns in cleaned data:", df.columns)  # Debugging

    # Identify One-Hot Encoded `relation_*` Columns
    relation_columns = [col for col in df.columns if "relation_" in col]

    if len(relation_columns) == 0:
        print("ERROR: 'relation' column missing after data cleaning!")
        return None

    # Convert One-Hot Encoded `relation_*` Columns Back to a Single `relation` Column
    df['relation'] = df[relation_columns].idxmax(axis=1)  # Gets the column with max value (1)
    df['relation'] = df['relation'].apply(lambda x: int(x.split("_")[-1]))  # Extracts numerical value

    # Drop one-hot relation columns after merging them
    df = df.drop(columns=relation_columns)
    X = df.drop(columns=['relation'])

    # Ennustetaan todennäköisyydet luokalle 3
    proba_class3 = stacking_model.predict_proba(X)[:, 1]

    # Lasketaan "ei-luokka-3" -score
    not_class3_score = 1 - proba_class3
    scaler = MinMaxScaler(feature_range=(0, 100))
    not_class3_score_scaled = scaler.fit_transform(not_class3_score.reshape(-1, 1)).flatten()
    # Create dataframe and store it to dict
    results = X.copy()
    results['motivation'] = not_class3_score_scaled
    scores = results.to_dict(orient="records")
    storage.save_json(scores, score_file)

    print(f"Predictions successfully saved as '{score_file}.json'")
    return scores

def t_predict(data="rawData", model_name=f"{MODEL_NAME}_t", score_file="motivation_student_scores_meta_t_default", cleaning:bool=True):
    """
    Trains Randomforest and immediately makes predictions on the provided data.

    Args:
        data (str): Raw or pre-cleaned data.
        model_name (str): Name to save the trained model.
        score_file (str): Name of the file to save predictions.
        cleaning (bool): Whether to clean data before training/prediction.

    Returns:
        dict: A dictionary containing predictions and scores.
    """
    # Clean data and change the file name to proper
    if cleaning:
        get_cleaner("motivation_data_cleaning_version2").clean_data(data, "motivation_t_meta_predict_clean")
        data = "motivation_t_meta_predict_clean"
    train(data, model_name, cleaning=False)
    return predict(data, model_name, score_file, cleaning=False)
t_predict()