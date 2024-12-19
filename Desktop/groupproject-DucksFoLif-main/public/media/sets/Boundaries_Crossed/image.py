import os
import mysql.connector

# Database configuration
db_config = {
    'user': 'root',  # Update with your MySQL username
    'password': '1598',  # Update with your MySQL password
    'host': 'localhost',
    'database': 'pokemon_cards'  # Update with your database name
}

# Path to the folder containing images
image_folder = "/home/ducksfolif/groupproject-DucksFoLif/public/media/sets/Boundaries_Crossed"

# Connect to the database
try:
    connection = mysql.connector.connect(**db_config)
    cursor = connection.cursor()

    # Iterate through each file in the folder
    for image_name in os.listdir(image_folder):
        if image_name.endswith(".jpg"):  # Process only JPG files
            card_id = os.path.splitext(image_name)[0]  # Get the ID from the file name
            image_path = os.path.join(image_folder, image_name)

            # Read the image as binary data
            with open(image_path, "rb") as file:
                image_data = file.read()

            # Update the database
            query = """
            UPDATE cards
            SET image_path = %s
            WHERE id = %s;
            """
            cursor.execute(query, (image_data, card_id))
            print(f"Updated card ID {card_id} with image.")

    # Commit the changes
    connection.commit()

except mysql.connector.Error as err:
    print(f"Error: {err}")
finally:
    if connection.is_connected():
        cursor.close()
        connection.close()
