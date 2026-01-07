from model import train_model
import os

if __name__ == '__main__':
    data_path = os.path.join(os.path.dirname(__file__), 'data_file.csv')
    model_path = os.path.join(os.path.dirname(__file__), 'model.joblib')
    res = train_model(data_path=data_path, model_path=model_path)
    print(res)
