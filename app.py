from flask import Flask, render_template, request, redirect, url_for, session, flash

app = Flask(__name__)
# clave secreta obligatoria para las sesiones y alertas flash
app.secret_key = 'clave_secreta_minimarket_damir_2026'

# ==========================================================================
# ✓ base de datos simulada en memoria para registrar usuarios
# ==========================================================================
usuarios_db = {}


# ==========================================================================
# 1. rutas principales de la tienda y todos los pasillos
# ==========================================================================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/abarrotes')
def abarrotes():
    return render_template('abarrotes.html')

@app.route('/bebidas')
def bebidas():
    return render_template('bebidas.html')

@app.route('/desayuno')
def desayuno():
    return render_template('desayuno.html')

@app.route('/snacks')
def snacks():
    return render_template('snacks.html')

# ¡aquí está la ruta nueva de limpieza que te faltaba y causaba el error!
@app.route('/limpieza')
def limpieza():
    return render_template('limpieza.html')

@app.route('/carrito')
def carrito():
    return render_template('carrito.html')


# ==========================================================================
# 2. sistema de autenticación de usuarios (login, registro, perfil)
# ==========================================================================

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        correo = request.form.get('correo')
        
        # validar si el correo ingresado ya existe en la base de datos simulada
        if correo in usuarios_db:
            session['usuario_correo'] = correo
            session['usuario_nombre'] = usuarios_db[correo]['nombre']
            return redirect(url_for('index'))
        else:
            flash('el correo electrónico no se encuentra registrado.')
            return redirect(url_for('login'))
            
    return render_template('login.html')

@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'POST':
        nombre = request.form.get('nombre')
        apellido = request.form.get('apellido')
        celular = request.form.get('celular')
        correo = request.form.get('correo')
        direccion = request.form.get('direccion')

        # validación crítica obligatoria: verificar si el correo ya existe en otra cuenta
        if correo in usuarios_db:
            flash('este correo ya existe en otra cuenta.')
            return redirect(url_for('registro'))

        # si el correo es nuevo, guardamos el perfil completo en memoria
        usuarios_db[correo] = {
            'nombre': nombre,
            'apellido': apellido,
            'celular': celular,
            'direccion': direccion
        }
        
        # inicio de sesión automático inmediato tras crear la cuenta
        session['usuario_correo'] = correo
        session['usuario_nombre'] = nombre
        return redirect(url_for('perfil'))

    return render_template('registro.html')

@app.route('/perfil')
def perfil():
    # si un usuario intenta ingresar sin haber iniciado sesión, lo redirige al login
    if 'usuario_correo' not in session:
        return redirect(url_for('login'))
    
    # jalar la información guardada usando el correo único guardado en la sesión
    datos_usuario = usuarios_db.get(session['usuario_correo'])
    return render_template('perfil.html', usuario=datos_usuario, correo=session['usuario_correo'])

@app.route('/logout')
def logout():
    session.clear() # destruye los datos de la sesión activa para cerrar la cuenta
    return redirect(url_for('index'))


# ==========================================================================
# 3. ejecución local del proyecto
# ==========================================================================
if __name__ == '__main__':
    app.run(debug=True)